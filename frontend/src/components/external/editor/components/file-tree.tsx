import React, { useState } from 'react'
import { sortDir, sortFile } from "../utils/file-manager";
import type { Directory, File } from "../utils/file-manager";
import { getIcon } from "./icon";
import styled from "@emotion/styled";
import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import { FiFilePlus, FiFolderPlus } from "react-icons/fi";

interface TreeSharedProps {
  selectedFile: File | undefined;
  onSelect: (file: File) => void;
  creatingState?: { type: "file" | "dir", parentId: string } | null;
  onCreationComplete?: (name: string, type: "file" | "dir", parentId: string) => void;
  onAction?: (type: "file" | "dir", parentId: string) => void;
}

interface FileTreeProps extends TreeSharedProps {
  rootDir: Directory;   // 根目录
}

export const FileTree = (props: FileTreeProps) => {
  const { rootDir, ...sharedProps } = props;
  return (
    <TreeContainer>
      {props.creatingState && props.creatingState.parentId === props.rootDir.id && (
        <CreationInputContainer depth={1}>
          <FileIcon extension={props.creatingState.type === "file" ? "txt" : ""} name={props.creatingState.type === "dir" ? "folder" : ""} />
          <StyledInput
            autoFocus
            placeholder={props.creatingState.type === "file" ? "File Name..." : "Folder Name..."}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                props.onCreationComplete?.(e.currentTarget.value, props.creatingState!.type, props.creatingState!.parentId);
              } else if (e.key === "Escape") {
                props.onCreationComplete?.("", props.creatingState!.type, props.creatingState!.parentId); // Cancel
              }
            }}
          />
        </CreationInputContainer>
      )}
      <SubTree directory={props.rootDir} {...sharedProps} />
    </TreeContainer>
  )
}

const TreeContainer = styled.div`
  display: flex;
  flex-direction: column;
  user-select: none;
`

interface SubTreeProps extends TreeSharedProps {
  directory: Directory;   // 根目录
}

const SubTree = (props: SubTreeProps) => {
  const { directory, ...sharedProps } = props;
  return (
    <div>
      {
        directory.dirs
          .sort(sortDir)
          .map(dir => (
            <React.Fragment key={dir.id}>
              <DirDiv
                directory={dir}
                {...sharedProps}
              />
            </React.Fragment>
          ))
      }
      {
        directory.files
          .sort(sortFile)
          .map(file => (
            <React.Fragment key={file.id}>
              <FileDiv
                file={file}
                selectedFile={props.selectedFile}
                onClick={() => props.onSelect(file)} />
            </React.Fragment>
          ))
      }
    </div>
  )
}

const FileDiv = ({ file, icon, selectedFile, onClick, arrow, actions }: {
  file: File | Directory; // 当前文件
  icon?: string;          // 图标名称
  selectedFile: File | undefined;     // 选中的文件
  onClick: () => void;    // 点击事件
  arrow?: React.ReactNode;
  actions?: React.ReactNode;
}) => {
  const isSelected = (selectedFile && selectedFile.id === file.id) as boolean;
  const depth = file.depth;
  return (
    <RowContainer
      depth={depth}
      isSelected={isSelected}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}>
      <ArrowBox>
        {arrow}
      </ArrowBox>
      <FileIcon
        name={icon}
        extension={file.name.split('.').pop() || ""} />
      <FileName>
        {file.name}
      </FileName>
      <div style={{ flexGrow: 1 }} />
      <div className="actions">
        {actions}
      </div>
    </RowContainer>
  )
}

const DirDiv = (props: {
  directory: Directory;
} & TreeSharedProps) => {
  const { directory, selectedFile, onSelect, creatingState, onCreationComplete, onAction } = props;
  let defaultOpen = false;
  if (selectedFile)
    defaultOpen = isChildSelected(directory, selectedFile)
  const [open, setOpen] = useState(defaultOpen);

  const handleToggle = () => {
    if (!open) {
      onSelect(directory as any)
    }
    setOpen(!open)
  }

  return (
    <>
      <FileDiv
        file={directory}
        icon={open ? "openDirectory" : "closedDirectory"}
        selectedFile={selectedFile}
        arrow={open ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
        onClick={handleToggle}
        actions={
          <RowActions>
            <ActionButton onClick={(e) => { e.stopPropagation(); onAction?.("file", directory.id); if (!open) setOpen(true); }} title="New File">
              <FiFilePlus size={14} />
            </ActionButton>
            <ActionButton onClick={(e) => { e.stopPropagation(); onAction?.("dir", directory.id); if (!open) setOpen(true); }} title="New Folder">
              <FiFolderPlus size={14} />
            </ActionButton>
          </RowActions>
        }
      />
      {
        open ? (
          <>
            {creatingState && creatingState.parentId === directory.id && (
              <CreationInputContainer depth={directory.depth + 1}>
                <FileIcon extension={creatingState.type === "file" ? "txt" : ""} name={creatingState.type === "dir" ? "folder" : ""} />
                <StyledInput
                  autoFocus
                  placeholder={creatingState.type === "file" ? "File Name..." : "Folder Name..."}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      onCreationComplete?.(e.currentTarget.value, creatingState.type, creatingState.parentId);
                    } else if (e.key === "Escape") {
                      onCreationComplete?.("", creatingState.type, creatingState.parentId); // Cancel
                    }
                  }}
                />
              </CreationInputContainer>
            )}
            <SubTree
              directory={directory}
              selectedFile={selectedFile}
              onSelect={onSelect}
              creatingState={creatingState}
              onCreationComplete={onCreationComplete}
              onAction={onAction}
            />
          </>
        ) : null
      }
    </>
  )
}

const isChildSelected = (directory: Directory, selectedFile: File) => {
  let res: boolean = false;

  function isChild(dir: Directory, file: File) {
    if (file.parentId === dir.id) {
      res = true;
      return;
    }
    dir.dirs.forEach((item) => {
      isChild(item, file);
    })
  }

  isChild(directory, selectedFile);
  return res;
}

const RowContainer = styled.div<{ depth: number, isSelected: boolean }>`
  display: flex;
  align-items: center;
  padding-left: ${props => (props.depth - 1) * 12 + 8}px;
  height: 22px;
  background-color: ${props => props.isSelected ? "#37373d" : "transparent"};
  cursor: pointer;
  color: ${props => props.isSelected ? "#ffffff" : "#cccccc"};
  font-size: 13px;

  &:hover {
    background-color: #2a2d2e;
    color: #ffffff;
    
    .actions {
        display: flex;
    }
  }

  .actions {
      display: none;
      align-items: center;
      padding-right: 8px;
  }
`

const ArrowBox = styled.div`
  width: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #c5c5c5;
`

const FileName = styled.span`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

const FileIcon = ({ extension, name }: { name?: string, extension?: string }) => {
  let icon = getIcon(extension || "", name || "");
  return (
    <IconSpan>
      {icon}
    </IconSpan>
  )
}

const IconSpan = styled.span`
  display: flex;
  width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
  margin-right: 4px;
`

const CreationInputContainer = styled.div<{ depth: number }>`
    display: flex;
    align-items: center;
    padding-left: ${props => (props.depth - 1) * 12 + 24}px; /* Align with filename */
    padding-right: 8px;
    height: 22px;
`

const StyledInput = styled.input`
  background: #3c3c3c;
  border: 1px solid #007fd4;
  color: white;
  outline: none;
  padding: 1px 4px;
  width: 100%;
  font-size: 12px;
  height: 18px;
`

const RowActions = styled.div`
    display: flex;
    gap: 4px;
`

const ActionButton = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border-radius: 3px;
    color: #cccccc;
    &:hover {
        background-color: #444444;
        color: #ffffff;
    }
`

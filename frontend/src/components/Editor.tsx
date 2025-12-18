import { useEffect, useMemo, useState } from "react";
import Sidebar from "./external/editor/components/sidebar";
import { Code } from "./external/editor/editor/code";
import styled from "@emotion/styled";
import { buildFileTree, Type } from "./external/editor/utils/file-manager";
import type { File, RemoteFile } from "./external/editor/utils/file-manager";
import { FileTree } from "./external/editor/components/file-tree";
import { Socket } from "socket.io-client";

// credits - https://codesandbox.io/s/monaco-tree-pec7u
export const Editor = ({
  files,
  onSelect,
  selectedFile,
  socket,
  onCreateFile,
  onCreateFolder
}: {
  files: RemoteFile[];
  onSelect: (file: File) => void;
  selectedFile: File | undefined;
  socket: Socket;
  onCreateFile?: (name?: string) => void;
  onCreateFolder?: (name?: string) => void;
}) => {
  const rootDir = useMemo(() => {
    return buildFileTree(files);
  }, [files]);

  const [creatingState, setCreatingState] = useState<{ type: "file" | "dir", parentId: string } | null>(null);

  useEffect(() => {
    if (!selectedFile && rootDir.files.length > 0) {
      onSelect(rootDir.files[0])
    }
  }, [selectedFile])

  const handleCreate = (type: "file" | "dir") => {
    // Determine parentId based on selected file
    let parentId = "root"; // Default to root
    if (selectedFile) {
      if (selectedFile.type === Type.DIRECTORY) {
        parentId = selectedFile.id;
      } else if (selectedFile.parentId) {
        // If file selected, verify parentId exists and is not '0' (root)
        // But our file system sets parentId='0' for root files.
        // If parentId is '0', my logic for inline input expects parentId to match directory.id
        // The root directory has id='root'. My buildFileTree sets id='root' for rootDir.
        // But for files, parentId='0' when at root.
        // So if parentId='0', we use 'root'.
        parentId = selectedFile.parentId === '0' ? 'root' : selectedFile.parentId!;
      }
    }
    setCreatingState({ type, parentId });
  }

  return (
    <div style={{ width: "100%", display: "flex" }}>
      <Main>
        <Sidebar onNewFile={() => handleCreate("file")} onNewFolder={() => handleCreate("dir")}>
          <FileTree
            rootDir={rootDir}
            selectedFile={selectedFile}
            onSelect={onSelect}
            creatingState={creatingState}
            onAction={(type, parentId) => {
              setCreatingState({ type, parentId });
            }}
            onCreationComplete={(name, type, parentId) => {
              let fullPath = name;
              if (parentId !== "root") {
                // Need to find the path of the parent directory.
                // The parentId IS the path in our current implementation (ws.ts sends path as id?)
                // Let's check buildFileTree. Yes, id = item.path.
                // So parentId is the relative path of the directory.
                fullPath = `${parentId}/${name}`;
              }

              if (type === "file") {
                onCreateFile?.(fullPath);
              } else {
                onCreateFolder?.(fullPath);
              }
              setCreatingState(null);
            }}
          />
        </Sidebar>
        <Code socket={socket} selectedFile={selectedFile} />
      </Main>
    </div>
  );
};

const Main = styled.main`
  display: flex;
  width: 100%; /* This was the missing piece */
`;
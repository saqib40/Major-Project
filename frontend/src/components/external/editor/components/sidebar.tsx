import type { ReactNode } from 'react';
import styled from "@emotion/styled";
import { FiFilePlus, FiFolderPlus } from "react-icons/fi";

export const Sidebar = ({ children, onNewFile, onNewFolder }: { children: ReactNode, onNewFile?: () => void, onNewFolder?: () => void }) => {
  return (
    <Aside>
      <Header>
        <Title>FILES</Title>
        <Actions>
          <IconWrapper onClick={onNewFile} title="New File">
            <FiFilePlus size={16} />
          </IconWrapper>
          <IconWrapper onClick={onNewFolder} title="New Folder">
            <FiFolderPlus size={16} />
          </IconWrapper>
        </Actions>
      </Header>
      {children}
    </Aside>
  )
}

const Aside = styled.aside`
  width: 250px;
  height: 100vh;
  border-right: 2px solid;
  border-color: #242424;
  display: flex;
  flex-direction: column;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #242424;
  background-color: #1e1e1e;
`

const Title = styled.span`
  font-size: 0.8rem;
  font-weight: bold;
  color: #cccccc;
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
`

const IconWrapper = styled.div`
  cursor: pointer;
  color: #cccccc;
  &:hover {
    color: #ffffff;
  }
  display: flex;
  align-items: center;
`

export default Sidebar

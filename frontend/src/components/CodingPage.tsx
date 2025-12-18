import { useEffect, useState } from 'react';
import { Editor } from './Editor';
import { Type } from './external/editor/utils/file-manager';
import type { File, RemoteFile } from './external/editor/utils/file-manager';
import { useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { Output } from './Output';
import { TerminalComponent as Terminal } from './Terminal';
import { Socket, io } from 'socket.io-client';
import { EXECUTION_ENGINE_URI } from '../config';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw; /* Take full viewport width */
  height: 100vh; /* Take full viewport height */
  margin: 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px;
  background-color: var(--panel-background);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0; /* Prevent header from shrinking */
`;

const StyledButton = styled.button`
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: var(--button-text-color);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: 0.9em;
  font-weight: 500;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #4091e3;
  }
`;

const Workspace = styled.div`
  display: flex;
  flex-grow: 1;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  flex: 3; /* Give more space to the editor */
  min-width: 0; /* Allow the panel to shrink if needed */
  display: flex; /* Make it a flex container for its children */
`;

const RightPanel = styled.div`
  flex: 2; /* Give less space to the output/terminal */
  min-width: 0; /* Allow the panel to shrink */
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-color);
`;

const LoadingContainer = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5em;
`;

function useSocket(replId: string) {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io(`${EXECUTION_ENGINE_URI}?roomId=${replId}`);
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [replId]);

    return socket;
}

export const CodingPage = () => {
    const [searchParams] = useSearchParams();
    const replId = searchParams.get('replId') ?? '';
    const [loaded, setLoaded] = useState(false);
    const socket = useSocket(replId);
    const [fileStructure, setFileStructure] = useState<RemoteFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
    const [showOutput, setShowOutput] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.on('loaded', ({ rootContent }: { rootContent: RemoteFile[] }) => {
                setLoaded(true);
                setFileStructure(rootContent);
            });
            socket.on('file:refresh', (event: { type: 'add' | 'unlink', data?: RemoteFile, path?: string }) => {
                setFileStructure(prev => {
                    if (event.type === 'add' && event.data) {
                        // Avoid duplicates
                        if (prev.some(f => f.path === event.data?.path)) return prev;
                        return [...prev, event.data];
                    } else if (event.type === 'unlink' && event.path) {
                        return prev.filter(f => f.path !== event.path);
                    }
                    return prev;
                });
            });
        }
    }, [socket]);

    const onSelect = (file: File) => {
        if (file.type === Type.DIRECTORY) {
            setSelectedFile(file);
            socket?.emit("fetchDir", file.path, (data: RemoteFile[]) => {
                setFileStructure(prev => {
                    const allFiles = [...prev, ...data];
                    // Simple deduplication based on path
                    return allFiles.filter((file, index, self) =>
                        index === self.findIndex(f => f.path === file.path)
                    );
                });
            });
        } else {
            socket?.emit("fetchContent", { path: file.path }, (data: string) => {
                file.content = data;
                setSelectedFile(file);
            });
        }
    };

    const handleCreateFile = (fileName?: string) => {
        if (fileName) {
            socket?.emit("createFile", { path: fileName });
        }
    };

    const handleCreateFolder = (folderName?: string) => {
        if (folderName) {
            socket?.emit("createFolder", { path: folderName });
        }
    };

    if (!loaded) {
        return <LoadingContainer>Loading Environment...</LoadingContainer>;
    }

    return (
        <Container>
            <Header>
                <StyledButton onClick={() => setShowOutput(!showOutput)}>
                    {showOutput ? "Hide Output" : "Show Output"}
                </StyledButton>
            </Header>
            <Workspace>
                <LeftPanel>
                    <Editor
                        socket={socket!}
                        selectedFile={selectedFile}
                        onSelect={onSelect}
                        files={fileStructure}
                        onCreateFile={handleCreateFile}
                        onCreateFolder={handleCreateFolder}
                    />
                </LeftPanel>
                <RightPanel>
                    {showOutput && <Output />}
                    <Terminal socket={socket!} />
                </RightPanel>
            </Workspace>
        </Container>
    );
}
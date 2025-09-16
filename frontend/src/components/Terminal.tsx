// frontend/src/components/Terminal.tsx

import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Terminal as XtermTerminal } from "xterm";
import { FitAddon } from 'xterm-addon-fit';
import styled from "@emotion/styled";
import "xterm/css/xterm.css";

const TerminalContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1; 
    min-height: 0;
`;

const TerminalHeader = styled.div`
    background-color: var(--panel-background);
    color: var(--text-color);
    padding: 8px 12px;
    font-weight: 500;
    border-bottom: 1px solid var(--border-color);
`;

const TerminalBody = styled.div`
    flex-grow: 1;
    background-color: black;
    padding: 5px;
`;

const fitAddon = new FitAddon();

const OPTIONS_TERM = {
    cursorBlink: true,
    theme: {
        background: "black"
    }
};

export const TerminalComponent = ({ socket }: { socket: Socket | null }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<XtermTerminal | null>(null); // Ref to hold the terminal instance

    useEffect(() => {
        if (!terminalRef.current || !socket || termRef.current) {
            return;
        }

        // Create and open the terminal only once
        const term = new XtermTerminal(OPTIONS_TERM);
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();
        termRef.current = term; // Store instance

        socket.emit("requestTerminal");

        const decoder = new TextDecoder('utf-8');

        function terminalHandler({ data }: { data: ArrayBuffer }) {
            if (data instanceof ArrayBuffer) {
                const decodedData = decoder.decode(data);
                term.write(decodedData);
            }
        }
        
        socket.on("terminal", terminalHandler);

        term.onData((data) => {
            socket.emit('terminalData', { data });
        });

        // Send an initial newline to get the prompt
        socket.emit('terminalData', { data: '\n' });

        return () => {
            socket.off("terminal", terminalHandler);
            // Optional: Dispose the terminal instance on cleanup
            term.dispose();
            termRef.current = null;
        }
    }, [socket]);

    return (
        <TerminalContainer>
            <TerminalHeader>Terminal</TerminalHeader>
            <TerminalBody ref={terminalRef}></TerminalBody>
        </TerminalContainer>
    );
}
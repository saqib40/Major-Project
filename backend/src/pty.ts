// backend/src/pty.ts

//@ts-ignore => someone fix this
import { fork, IPty } from 'node-pty';
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname for ES Module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHELL = "bash";

export class TerminalManager {
    private sessions: { [id: string]: {terminal: IPty, replId: string;} } = {};

    constructor() {
        this.sessions = {};
    }
    
    createPty(id: string, replId: string, onData: (data: string, id: number) => void) {
        let term = fork(SHELL, [], {
            cols: 100,
            name: 'xterm',
            cwd: path.join(__dirname, `../tmp/${replId}`)
        });
        
        term.onData((data: string) => onData(data, term.pid)); // The 'data' event was deprecated

        this.sessions[id] = {
            terminal: term,
            replId
        };

        // FIXED: The session is stored by the socket `id`, so we must use `id` to delete it.
        term.on('exit', () => {
            delete this.sessions[id];
        });

        return term;
    }

    write(terminalId: string, data: string) {
        this.sessions[terminalId]?.terminal.write(data);
    }

    clear(terminalId: string) {
        this.sessions[terminalId]?.terminal.kill();
        delete this.sessions[terminalId];
    }
}
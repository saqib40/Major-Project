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
        // output listener, and pid is Process ID
        term.on('data', (data: string) => onData(data, term.pid));

        this.sessions[id] = {
            terminal: term,
            replId
        };
        term.on('exit', () => {
            delete this.sessions[term.pid];
        });
        return term;
    }

    write(terminalId: string, data: string) {
        this.sessions[terminalId]?.terminal.write(data);
    }

    clear(terminalId: string) {
        // kill the process
        this.sessions[terminalId].terminal.kill();
        // remove session entry from map
        delete this.sessions[terminalId];
    }
}
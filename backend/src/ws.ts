import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import path from "path";
import { fetchDir, fetchFileContent, saveFile, createFolder } from "./fs.js";
import { TerminalManager } from "./pty.js";
import { fileURLToPath } from "url";
import chokidar from "chokidar";

const terminalManager = new TerminalManager();

// Recreate __dirname for ES Module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initWs(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        cors: {
            // Should restrict this more!
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", async (socket) => {
        // Auth checks should happen here
        const replId = socket.handshake.query.roomId as string;

        if (!replId) {
            socket.disconnect();
            terminalManager.clear(socket.id);
            return;
        }

        const watchDir = path.join(__dirname, `../tmp/${replId}`);
        const watcher = chokidar.watch(watchDir, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            ignoreInitial: true // Don't emit add events for existing files on startup
        });

        watcher.on('add', (filePath) => {
            const relativePath = path.relative(watchDir, filePath);
            if (relativePath.startsWith('.')) return;
            socket.emit('file:refresh', {
                type: 'add',
                data: { type: 'file', path: `/${relativePath}`, name: path.basename(relativePath) }
            });
        });
        watcher.on('addDir', (filePath) => {
            const relativePath = path.relative(watchDir, filePath);
            if (relativePath.startsWith('.')) return;
            socket.emit('file:refresh', {
                type: 'add',
                data: { type: 'dir', path: `/${relativePath}`, name: path.basename(relativePath) }
            });
        });
        watcher.on('unlink', (filePath) => {
            const relativePath = path.relative(watchDir, filePath);
            socket.emit('file:refresh', { type: 'unlink', path: `/${relativePath}` });
        });
        watcher.on('unlinkDir', (filePath) => {
            const relativePath = path.relative(watchDir, filePath);
            socket.emit('file:refresh', { type: 'unlink', path: `/${relativePath}` });
        });

        socket.on("createFile", async ({ path: filePath }: { path: string }) => {
            const fullPath = path.join(watchDir, filePath);
            await saveFile(fullPath, "");
        });

        socket.on("createFolder", async ({ path: folderPath }: { path: string }) => {
            const fullPath = path.join(watchDir, folderPath);
            await createFolder(fullPath);
        });

        socket.emit("loaded", {
            rootContent: await fetchDir(watchDir, "")
        });

        initHandlers(socket, replId);

        socket.on("disconnect", () => {
            watcher.close();
        });
    });
}

function initHandlers(socket: Socket, replId: string) {

    socket.on("disconnect", () => {
        console.log("user disconnected");
        // do the clean up of things on server's memory
    });

    socket.on("fetchDir", async (dir: string, callback) => {
        const dirPath = path.join(__dirname, `../tmp/${replId}/${dir}`);
        const contents = await fetchDir(dirPath, dir);
        callback(contents);
    });

    socket.on("fetchContent", async ({ path: filePath }: { path: string }, callback) => {
        const fullPath = path.join(__dirname, `../tmp/${replId}/${filePath}`);
        const data = await fetchFileContent(fullPath);
        callback(data);
    });

    // TODO: contents should be diff, not full file
    // Should be validated for size
    // Should be throttled before updating S3 (or use an S3 mount)
    // S3 removed, now just local file
    socket.on("updateContent", async ({ path: filePath, content }: { path: string, content: string }) => {
        const fullPath = path.join(__dirname, `../tmp/${replId}/${filePath}`);
        await saveFile(fullPath, content);
    });

    socket.on("requestTerminal", async () => {
        terminalManager.createPty(socket.id, replId, (data, id) => {
            socket.emit('terminal', {
                data: Buffer.from(data, "utf-8")
            });
        });
    });

    socket.on("terminalData", async ({ data }: { data: string, terminalId: number }) => {
        terminalManager.write(socket.id, data);
    });

}
import { Express } from "express";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initHttp(app: Express) {
    app.use(express.json());
    app.post("/project", async (req, res) => {
        const { replId, language } = req.body;
        if (!replId) {
            res.status(400).send("Bad request");
            return;
        }
        
        const sourcePath = path.join(__dirname, `../../S3-base/${language}`);
        const destinationPath = path.join(__dirname, `../tmp/${replId}`);

         // Check if source exists
         if (!fs.existsSync(sourcePath)) {
            res.status(400).send("Invalid language or base content missing");
            return;
        }

        try {
            await fs.promises.cp(sourcePath, destinationPath, { recursive: true });
            res.send("Project created");
        } catch (error) {
            console.error("Error creating project:", error);
            res.status(500).send("Internal Server Error");
        }
    });
}
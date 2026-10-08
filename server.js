import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises'; // 🚀 Async implementation
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import router from './route.js';

// Setup basic directory scaffolding synchronously before initializing the server instance
if (!existsSync("./upload/")) mkdirSync("./upload");
if (!existsSync("./cover/")) mkdirSync("./cover");

dotenv.config();
const port = process.env.SERVER_PORT || 2300;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🚀 Cleaned up double duplicate CORS initialization syntax
const corsOptions = {
  origin: ["http://localhost:5173", "https://bengplayer.vercel.app"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.use('/upload', express.static(join(__dirname, 'upload')));
app.use('/cover', express.static(join(__dirname, 'cover')));
app.use("/", router);

const server = createServer(app);
const io = new Server(server, { cors: corsOptions });

io.on('connection', (socket) => {
  // 🚀 Switched to asynchronous reading inside the socket callback
  socket.on('get-files', async (callback) => {
    try {
      const data = await readFile("./data.json", "utf-8");
      callback(JSON.parse(data));
    } catch (err) {
      console.error("Socket failed to fetch data file:", err);
      callback([]);
    }
  });
});

server.listen(port, () => {
  console.log("Server running on port ", port);
});

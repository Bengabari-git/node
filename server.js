
import express from 'express';
import multer from 'multer';
import {createServer} from 'http'
import {Server} from 'socket.io'
import {readFileSync} from 'node:fs'
import cors from 'cors'
import { join , dirname } from 'path'
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'
import router from './route.js'
import fs from 'fs'

if (!fs.existsSync("./upload/")) {
  fs.mkdirSync("./upload");
}

if (!fs.existsSync("./cover/")) {
  fs.mkdirSync("./cover");
}


dotenv.config();
const port = process.env.SERVER_PORT || 2300;
const app = express();

cors({
  origin: ["http://localhost:5173", "https://bengplayer.vercel.app"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"], "Access-Control-Allow-Credentials": true,
  credentials: true
})


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(
  cors({
  origin: ["http://localhost:5173", "https://bengplayer.vercel.app"],
  methods: ["GET", "POST"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"], "Access-Control-Allow-Credentials": true,
  credentials: true
})
)
app.use('/upload', express.static(join(__dirname, 'upload')));
app.use('/cover', express.static(join(__dirname, 'cover')));
app.use("/", router);
const server = createServer(app);
const io = new Server(server,{
  cors: {
  origin: ['http://localhost:5173', 'https://bengplayer.vercel.app'], // Add local dev & production URLs
  methods: ['GET', 'POST'],
  credentials: true,
}
})

io.on('connection', (socket) => {
  socket.on('get-files', (callback) => {
    callback(JSON.parse(readFileSync("./data.json")));
  });
});




server.listen(port, () => {
  console.log("Server running on port ", port);
});

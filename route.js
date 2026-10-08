import { Router } from "express";
import multer from "multer";
import { existsSync } from "node:fs";
import { writeFile, readFile } from "node:fs/promises"; // 🚀 Switch to modern async promises
import path from "node:path";
import { parseFile } from 'music-metadata';

const router = Router();
const DATA_FILE = "./data.json";

// Safely initialize data file synchronously ONLY once at startup
if (!existsSync(DATA_FILE)) {
  await writeFile(DATA_FILE, JSON.stringify([]));
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds)) return "00:00";
  const min = Math.floor(timeInSeconds / 60);
  const sec = Math.floor(timeInSeconds % 60);
  const cmin = min < 10 ? `0${min}` : min;
  const csec = sec < 10 ? `0${sec}` : sec;
  return `${cmin}:${csec}`;
};

router.post("/sendFile", upload.single("file"), async function (req, res) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const mu = await parseFile(file.path);
    const { album, artist, title, genre, year, picture } = mu.common;
    const audioDuration = mu.format.duration;
    const songGenre = genre && genre.length > 0 ? genre[0] : "";

    // 🚀 Fixed the safe title slicing logic
    let songTitle = "";
    if (title) {
      songTitle = title.includes("|") ? title.slice(0, title.indexOf("|")).trim() : title;
    } else {
      songTitle = file.originalname.length > 10 
        ? file.originalname.slice(0, 10) 
        : file.originalname.slice(0, file.originalname.lastIndexOf("."));
    }

    let coverPath = null;

    if (picture && picture.length > 0) {
      const data = picture[0].data;
      const format = picture[0].format;
      const ext = format.split("/")[1] || "jpg";
      const filename = `${Date.now()}-cover.${ext}`;
      coverPath = path.join("cover", filename);

      // Async write to prevent event-loop freezing
      await writeFile(coverPath, Buffer.from(data));
    }

    // Async read files 
    const rawData = await readFile(DATA_FILE, "utf-8");
    let storedFiles = JSON.parse(rawData);
    
    let defaultCover = path.join("cover", "default_cover.png");
    let albumArt = !coverPath ? defaultCover : coverPath;

    storedFiles.push({
      title: songTitle,
      artist: artist || "Unknown Artist",
      album: album || "Unknown Album",
      path: file.path,
      year: year || "",
      duration: formatTime(audioDuration),
      genre: songGenre,
      albumart: albumArt
    });

    // Async write out changes
    await writeFile(DATA_FILE, JSON.stringify(storedFiles, null, 2));

    res.json({ message: "Successful" });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Internal Server Error processing audio" });
  }
});

export default router;

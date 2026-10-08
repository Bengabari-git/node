import { Router } from "express";
import multer from "multer";
import { writeFileSync, existsSync, mkdirSync, readFileSync, unlink } from "node:fs";
import path from "node:path";
import cors from 'cors';
import {parseFile} from 'music-metadata'



const router = Router();


if (!existsSync("./data.json")) {
  writeFileSync("./data.json", JSON.stringify([]));
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  dest: "./upload",
  storage: storage,
});

const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const min = Math.floor(timeInSeconds / 60);
    const sec = Math.floor(timeInSeconds % 60);
    const cmin = min < 10 ? `0${min}` : min;
    const csec = sec < 10 ? `0${sec}` : sec;
    return `${cmin}:${csec}`;
  };

router.post("/sendFile", upload.single("file"), async function (req, res) {
  const file = req.file;
  const fileObject = {
    name: file.filename,
    size: file.size,
    path: file.path,
  };
  console.log(fileObject);

  const mu = await parseFile(file.path);
  const { album, artist, title, genre, year, picture } = mu.common;
  const audioDuration = mu.format.duration;
  const songGenre = genre ? genre[0] : "";

  const slicedTitle = function () {
    return title.slice(0, title.indexOf("|"));
  };
  const slicedOriginalName = function () {
    if(file.originalname.length > 10){
      return file.originalname.slice(0, 10);
    }
    return file.originalname.slice(0, file.originalname.indexOf("."));
  };
  const songTitle = title ? slicedTitle() : slicedOriginalName();

  let coverPath = null;

  if (picture) {
    const data = picture[0].data;
    const format = picture[0].format;

    const base64 = Buffer.from(data).toString("base64");

    // Convert base64 → real image file
    const ext = format.split("/")[1] || "jpg";
    const filename = Date.now() + "-cover." + ext;
    coverPath = path.join("cover", filename);

   writeFileSync(coverPath, Buffer.from(base64, "base64"));
  }

  let storedfils = JSON.parse(readFileSync("./data.json"));
  let defaultCover = path.join("cover", "default_cover.png")
  let albumArt = !coverPath ? defaultCover : coverPath

  storedfils.push({
    title: songTitle,
    artist: artist || "",
    album: album || "",
    path: file.path,
    year: year || "",
    duration: formatTime(audioDuration),
    genre: songGenre,
    albumart: albumArt
  });

  writeFileSync("./data.json", JSON.stringify(storedfils));

  res.json({  
    message: "Successful",
  });
});


export default router;

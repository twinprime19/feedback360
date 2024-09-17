import { UPLOAD } from "@app/constants/biz.constant";
import { extname } from "path";
import { BadRequestException } from "@nestjs/common";
import fs from "file-system";
import * as xlsx from "xlsx";
let moment = require("moment");
const Sharp = require("sharp/lib");

export const uploadThumbnail = async (file: any) => {
  let uploadConfig = UPLOAD;
  let maxMB = 20;
  let maxBytes = maxMB * 1024 * 1024;
  if (file && file.size > maxBytes) {
    throw `File #${file.originalname} too big !`;
  }
  //make dir current YYYY/MM/DD
  fs.mkdir(
    require("path").resolve(uploadConfig.PATH_FOLDER) +
      "/" +
      moment().format("YYYY/MM")
  );

  let thumbnail = { sizes: {}, path: "" };
  let filename = file.originalname.split(".");
  let fileName = filename[0];
  const timestamps = Date.now();

  //START LOOP GENERATED THUMBNAILS
  for await (let size of uploadConfig.SIZES) {
    let destFileName =
      filename[0].replace(/\s/g, "_") +
      timestamps +
      "_" +
      size.name +
      "." +
      filename[filename.length - 1];
    if (size.type == "origin") {
      await Sharp(file.buffer)
        .resize(size.width)
        .toFile(
          require("path").resolve(uploadConfig.PATH_FOLDER) +
            "/" +
            moment().format("YYYY/MM") +
            "/" +
            destFileName
        )
        .then((info) => {})
        .catch((err) => {
          console.log(err);
        });
      thumbnail.path =
        "/uploads/" + moment().format("YYYY/MM") + "/" + destFileName;
    } else {
      let type = size.type;
      await Sharp(file.buffer)
        .resize(size.width, size.height)
        .toFile(
          require("path").resolve(uploadConfig.PATH_FOLDER) +
            "/" +
            moment().format("YYYY/MM") +
            "/" +
            destFileName
        )
        .then((info) => {})
        .catch((err) => {
          console.log(err);
        });
      thumbnail.sizes[type] = {
        width: size.width,
        height: size.height,
        path: "/uploads/" + moment().format("YYYY/MM") + "/" + destFileName,
      };
    }
  } //END LOOP GENERATED THUMBNAILS

  return { fileName, thumbnail };
};

export const uploadPdf = async (file: any) => {
  let uploadConfig = UPLOAD;
  let maxMB = 20;
  let maxBytes = maxMB * 1024 * 1024;
  if (file && file.size > maxBytes) {
    throw `File #${file.originalname} too big !`;
  }
  let uploadPath =
    require("path").resolve(uploadConfig.PATH_FOLDER) +
    "/" +
    moment().format("YYYY/MM");
  //make dir current YYYY/MM/DD
  fs.mkdir(uploadPath, { recursive: true });

  let filename = file.originalname.split(".");
  let fileName = filename[0];
  let timeUpload = moment().format("HHmmss");

  let destFileName =
    filename[0].replace(/\s/g, "_") +
    "_" +
    timeUpload +
    "." +
    filename[filename.length - 1];

  // lưu file pdf
  const destinationPath = require("path").join(uploadPath, destFileName);
  fs.writeFileSync(destinationPath, file.buffer);

  let pdf = "/uploads/" + moment().format("YYYY/MM") + "/" + destFileName;

  return { fileName, pdf };
};

export const imageFileFilter = async (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    req.fileValidationError = "Only image files are allowed!";
    return await callback(
      new BadRequestException("Only image files are allowed!"),
      false
    );
  }
  await callback(null, true);
};

export const pdfFileFilter = async (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(pdf)$/)) {
    req.fileValidationError = "Only image files are allowed!";
    return await callback(
      new BadRequestException("Only image files are allowed!"),
      false
    );
  }
  await callback(null, true);
};

export const audioFileFilter = async (req: any, file: any, callback: any) => {
  if (!file.originalname.match(/\.(wav)$/)) {
    req.fileValidationError = "Only WAV files are allowed!";
    return await callback(
      new BadRequestException("Only WAV files are allowed!"),
      false
    );
  }
  await callback(null, true);
};

export const editFileName = (req: any, file: any, callback: any) => {
  const name = file.originalname.split(".")[0];
  const destFileName = extname(file.originalname);
  const randomName = Array(3)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join("");
  const pathName =
    name.split(" ").join("_") + randomName + Date.now() + destFileName;
  callback(null, pathName);
};

export const importFileExcel = async (file: any) => {
  let maxMB = 20;
  let maxBytes = maxMB * 1024 * 1024;
  if (file && file.size > maxBytes) {
    throw `File #${file.originalname} too big !`;
  }

  try {
    let buffer = file.buffer;
    let workbook = xlsx.read(buffer, { type: "buffer" });

    let sheetName = workbook.SheetNames[0];
    let worksheet = workbook.Sheets[sheetName];
    let data = xlsx.utils.sheet_to_json(worksheet);
    return data;
  } catch (error) {
    throw `Data of file ${file.originalname} is error !`;
  }
};

export const importFileTxt = async (file: any) => {
  let maxMB = 20;
  let maxBytes = maxMB * 1024 * 1024;
  if (file && file.size > maxBytes) {
    throw `File #${file.originalname} too big !`;
  }

  try {
    let data = file.buffer.toString("utf8");
    const lines = data.trim().split("\n");
    const header = lines[0].split("|");
    const rows: any = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split("|");
      const row: any = {};
      for (let j = 0; j < header.length; j++) {
        if (header[j] !== "none") {
          row[header[j]] = values[j];
        }
      }
      rows.push(row);
    }

    return rows;
  } catch (error) {
    throw `Data of file ${file.originalname} is error !`;
  }
};

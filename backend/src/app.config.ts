/**
 * @file App config
 * @module app/config
 */

import path from "path";
import yargs from "yargs";
import * as dotenv from "dotenv";
dotenv.config();

const argv = yargs.argv as Record<string, string | void>;
const ROOT_PATH = path.join(__dirname, "..");
const packageJSON = require(path.resolve(ROOT_PATH, "package.json"));

export const APP = {
  PORT: 1353,
  ROOT_PATH,
  DEFAULT_CACHE_TTL: 60 * 60 * 24,
  MASTER: "Tiến Phước",
  NAME: "Tiến Phước",
  URL: "127.0.0.1",
  ADMIN_EMAIL: argv.admin_email || "admin@example.com",
  FE_NAME: "Tiến Phước",
  FE_URL: "https://feedback360.tienphuoc.com",
  STATIC_URL: "https://feedback360.tienphuoc.com",
  SIGNATURE: "Tiến Phước",
};

export const PROJECT = {
  name: packageJSON.name,
  version: packageJSON.version,
  author: packageJSON.author,
  homepage: packageJSON.homepage,
  documentation: packageJSON.documentation,
  repository: packageJSON.repository.url,
};

export const CROSS_DOMAIN = {
  allowedOrigins: [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:3000",
    "https://feedback360-api.tienphuoc.com",
    "http://feedback360-api.tienphuoc.com",
    "https://feedback360.tienphuoc.com",
    "http://feedback360.tienphuoc.com",
  ],
  allowedReferer: ["tienphuoc.com"],
};

export const MONGO_DB = {
  uri: argv.db_uri || `mongodb://127.0.0.1:27017/toolfeedback`,
};

export const REDIS = {
  host: "127.0.0.1",
  port: argv.redis_port || 6379,
  username: argv.redis_username || null,
  password: argv.redis_password || null,
};

export const AUTH = {
  expiresIn: argv.auth_expires_in || 9000,
  data: argv.auth_data || { user: "root" },
  jwtSecret: argv.auth_key || "toolfeedback",
  defaultPassword: argv.auth_default_password || "root",
};

export const EMAIL = {
  service: process.env.EMAIL_SERVICE || "gmail",
  host: process.env.EMAIL_HOST || "smtp.mailgun.org",
  port: Number(process.env.EMAIL_PORT) || 587,
  account: process.env.EMAIL_ACCOUNT || "example@gmail.com",
  password: process.env.EMAIL_PASSWORD || "password",
  from: `"${APP.FE_NAME}" <${
    process.env.EMAIL_ACCOUNT || "example@gmail.com"
  }>`,
};

export const GOOGLE = {
  jwtServiceAccountCredentials: argv.google_jwt_cred_json
    ? JSON.parse(argv.google_jwt_cred_json as string)
    : null,
};

export const AWS = {
  accessKeyId: argv.aws_access_key_id as string,
  secretAccessKey: argv.aws_secret_access_key as string,
  s3StaticRegion: argv.aws_s3_static_region as string,
  s3StaticBucket: argv.aws_s3_static_bucket as string,
};

export const DB_BACKUP = {
  s3Region: argv.db_backup_s3_region as string,
  s3Bucket: argv.db_backup_s3_bucket as string,
  password: argv.db_backup_file_password as string,
};

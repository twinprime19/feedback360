/**
 * @file App config
 * @module app/config
 */

import path from "path";
import yargs from "yargs";

const argv = yargs.argv as Record<string, string | void>;
const ROOT_PATH = path.join(__dirname, "..");
const packageJSON = require(path.resolve(ROOT_PATH, "package.json"));

export const APP = {
  PORT: 1353,
  ROOT_PATH,
  DEFAULT_CACHE_TTL: 60 * 60 * 24,
  MASTER: "Tool feedback",
  NAME: "Tool feedback",
  URL: "127.0.0.1",
  ADMIN_EMAIL: argv.admin_email || "admin@example.com",
  FE_NAME: "Tool feedback",
  FE_URL: "http://feedback-api.test.zinisoft.net",
  STATIC_URL: "http://feedback-api.test.zinisoft.net",
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
    "http://feedback.test.zinisoft.net",
    "http://feedback-api.test.zinisoft.net",
  ],
  allowedReferer: ["zinisoft.net"],
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
  port: 587,
  host: argv.email_host || "smtp.gmail.com",
  account: argv.email_account || "example@gmail.com",
  password: argv.email_password || "12345678",
  from: `"${APP.FE_NAME}" <${argv.email_from || argv.email_account}>`,
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

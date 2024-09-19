/**
 * @file Business constants & interfaces
 * @module constants/biz
 */
require("dotenv").config();

// https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
// language
export enum Language {
  English = 1,
  VietNam = 2,
  ALL = 3,
}

// sort
export enum SortType {
  Asc = 1,
  Desc = -1,
  Hottest = 2,
}

// publish state
export enum PublishState {
  Recycle = -1,
  Draft = 0,
  Published = 1,
}

// public state
export enum PublicState {
  Reserve = 0,
  Public = 1,
  Secret = -1,
}

// Question type state
export enum QuestionTypeState {
  POINT = 0,
  TEXT = 1,
}

// comment user state
export enum UserState {
  TRASH = -1,
  DRAFT = 0,
  ACTIVE = 1,
}

// comment user status
export enum UserStatus {
  OFFLINE = 0,
  ONLINE = 1,
}

// comment sex state
export enum SexState {
  FEMALE = 0,
  MALE = 1,
  ORTHER = 2,
}

// type state
export enum TypeState {
  Image = 0,
  Pdf = 1,
  Signature = 2,
}

// mối quan hệ
export enum RelationshipState {
  SELF = 0,
  PEER = 1,
  SUBORDINATE = 2,
  SENIOR = 3,
}

export const UPLOAD = {
  EXTENSION: [".png", ".jpg", ".jpeg", ".gif"],
  AVATAR: {
    width: 250,
    height: 250,
    name: "avatar",
  },
  SIZES: [
    {
      width: 1280,
      height: "auto",
      name: "origin",
      type: "origin",
    },
    {
      width: 300,
      height: 300,
      name: "300x300",
      type: "thumbnail",
    },
    {
      width: 120,
      height: 120,
      name: "120x120",
      type: "avatar",
    },
    {
      width: 240,
      height: 180,
      name: "240x180",
      type: "medium",
    },
    {
      width: 740,
      height: 555,
      name: "740x555",
      type: "medium_large",
    },
    {
      width: 576,
      height: 576,
      name: "576x576",
      type: "medium_square",
    },
  ],

  PATH_FOLDER: process.env.PATH_FOLDER || "./assets/uploads/",
};

export const DEFAULT_SETTING = [
  { name: "logo", value: "/uploads/2023/01/zz1673255257804_origin.jpg" },
  { name: "title", value: "insta" },
  { name: "subtitle", value: "QUICK SIGN RESTFULL API" },
  {
    name: "siteUrl",
    value: "https://gitlab.zinisoft.net/web-2023/instaautoapi",
  },
  { name: "siteEmail", value: "admin@example.com" },
  { name: "currency", value: "euro" },
  { name: "currencyPosition", value: "right" },
  { name: "thousandSeparator", value: "." },
  { name: "decimalSeparator", value: "." },
  { name: "numberOfDecimal", value: 1 },
  { name: "gptType", value: "sandbox" },
  { name: "gptKey", value: "" },
  { name: "gptTemperature", value: 0.5 },
  { name: "gptAccurate", value: 0.8 },
];

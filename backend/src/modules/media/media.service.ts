/**
 * @file Media service
 * @module module/media/service
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@app/transformers/model.transformer";
import {
  MongooseModel,
  MongooseDoc,
  MongooseID,
} from "@app/interfaces/mongoose.interface";
import { Media } from "./media.model";
import { User } from "../user/entities/user.entity";
import { PublishState, TypeState } from "@app/constants/biz.constant";
import { uploadPdf, uploadThumbnail } from "@app/utils/upload-file";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import moment from "moment";

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media) private readonly mediaModel: MongooseModel<Media>,
    @InjectModel(User) private readonly userModel: MongooseModel<User>
  ) {}

  // find all files pdf
  async paginator(
    query: PaginateQuery<Media>,
    options: PaginateOptions
  ): Promise<PaginateResult<Media>> {
    return await this.mediaModel.paginate(query, {
      ...options,
      populate: [{ path: "createdBy" }, { path: "signedBy" }],
    });
  }

  // get media
  async findOne(mediaID: string): Promise<MongooseDoc<Media>> {
    return await this.mediaModel
      .findOne({ _id: mediaID, deletedAt: null })
      .populate(["createdBy", "signedBy"])
      .exec()
      .then(
        (result) =>
          result || Promise.reject(`Media id "${mediaID}" isn't found!`)
      );
  }

  // get signatures of file Pdf
  async getSignaturePdf(): Promise<MongooseDoc<Media>[]> {
    return await this.mediaModel
      .find({
        type: TypeState.Signature,
        deletedAt: null,
      })
      .exec()
      .then((result) => result || Promise.reject(`Signature isn't found!`));
  }

  // create media
  public async uploadAvatar(file: any): Promise<MongooseDoc<Media>> {
    let media = await uploadThumbnail(file);

    let dataMedia = {
      title: media.fileName,
      caption: media.fileName,
      thumbnail: media.thumbnail,
      type: TypeState.Image,
      status: PublishState.Published,
    };

    let mediaObj = await this.mediaModel.create(dataMedia);
    return await this.findOne(String(mediaObj._id));
  }

  public async uploadMultiple(files: any): Promise<MongooseDoc<any>> {
    if (!files.length) throw `Files isn't found!`;

    let data: object[] = [];
    for (let file of files) {
      let media = await uploadThumbnail(file);
      let fileObj = {
        title: media.fileName,
        caption: media.fileName,
        thumbnail: media.thumbnail,
        type: TypeState.Image,
        status: PublishState.Published,
      };
      let mediaObj = await this.mediaModel.create(fileObj);
      if (mediaObj) data.push(mediaObj._id);
    }
    return data;
  }

  // upload pdf
  public async uploadPdf(file: any): Promise<MongooseDoc<Media>> {
    let media = await uploadPdf(file);

    let dataMedia = {
      title: media.fileName,
      caption: media.fileName,
      pdf: media.pdf,
      type: TypeState.Pdf,
      status: PublishState.Published,
    };

    let mediaObj = await this.mediaModel.create(dataMedia);
    return await this.findOne(String(mediaObj._id));
  }

  // upload pdf
  public async uploadPdfHome(file: any): Promise<MongooseDoc<Media>> {
    let media = await uploadPdf(file);

    let dataMedia = {
      title: media.fileName,
      caption: media.fileName,
      pdf: media.pdf,
      type: TypeState.Pdf,
      status: PublishState.Published,
      createdBy: null,
    };

    let mediaObj = await this.mediaModel.create(dataMedia);
    return await this.findOne(String(mediaObj._id));
  }

  // upload signature
  public async uploadSignature(
    file: any,
    data: Partial<Media>
  ): Promise<MongooseDoc<Media>> {
    let media = await uploadThumbnail(file);

    let dataMedia = {
      title: data.title ?? media.fileName,
      caption: data.caption ?? media.fileName,
      thumbnail: media.thumbnail,
      type: TypeState.Signature,
      status: PublishState.Published,
    };

    let mediaObj = await this.mediaModel.create(dataMedia);
    return await this.findOne(String(mediaObj._id));
  }

  // upload pdf signed
  public async updatePdfSigned(
    mediaID: string,
    file: any,
    data: Partial<Media>
  ): Promise<MongooseDoc<Media>> {
    let existedMedia: any = await this.mediaModel
      .findOne({ _id: mediaID, type: TypeState.Pdf, deletedAt: null })
      .exec();
    if (!existedMedia) throw `Media id "${mediaID}" isn't found!`;

    if (data.signedBy && !existedMedia.signedBy.includes(data.signedBy)) {
      existedMedia.signedBy.push(data.signedBy);
    }

    let media: any = "";
    if (file) media = await uploadPdf(file);
    else media = existedMedia


    data.pdf = media.pdf;
    data.signedBy = existedMedia.signedBy;
    if (!data.signatures) data.signatures = [];

    await this.mediaModel
      .findByIdAndUpdate(mediaID, data, { new: true })
      .exec();

    return await this.findOne(String(mediaID));
  }

  // upload signature
  public async updateSignature(
    mediaID: string,
    file: any
  ): Promise<MongooseDoc<Media>> {
    let existedMedia: any = await this.mediaModel
      .findOne({ _id: mediaID, type: TypeState.Signature, deletedAt: null })
      .exec();
    if (!existedMedia) throw `Media id "${mediaID}" isn't found!`;

    let media = await uploadThumbnail(file);
    let thumbnail = media.thumbnail;

    await this.mediaModel
      .findByIdAndUpdate(mediaID, { thumbnail: thumbnail }, { new: true })
      .exec();

    return await this.findOne(String(mediaID));
  }

  // update media
  public async update(
    mediaID: MongooseID,
    newMedia: Partial<Media>
  ): Promise<MongooseDoc<Media>> {
    const existedMedia = await this.mediaModel
      .findOne({ _id: mediaID, deletedAt: null })
      .exec();
    if (!existedMedia) throw `Media id "${mediaID}" isn't found!`;

    await this.mediaModel
      .findByIdAndUpdate(mediaID, newMedia, { new: true })
      .exec();

    return await this.findOne(String(mediaID));
  }

  // delete media
  public async delete(mediaID: MongooseID): Promise<Media> {
    const media = await this.mediaModel
      .findByIdAndUpdate(
        mediaID,
        {
          deletedAt: moment(),
        },
        { new: true }
      )
      .exec();
    if (!media) throw `Media id "${mediaID}" isn't found!`;
    return media;
  }

  // delete many media
  public async batchDelete(mediaIDs: MongooseID[]) {
    const medias = await this.mediaModel
      .find({ _id: { $in: mediaIDs } })
      .exec();
    if (!medias) throw `List medias aren't found!`;

    return await this.mediaModel
      .updateMany(
        { _id: { $in: mediaIDs } },
        { deletedAt: moment() },
        { new: true }
      )
      .exec();
  }
}

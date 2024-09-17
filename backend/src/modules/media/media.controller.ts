/**
 * @file Media controller
 * @module module/media/controller
 */

import {
  Controller,
  UseGuards,
  Param,
  Get,
  Put,
  Post,
  Delete,
  Query,
  Body,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UploadedFiles,
} from "@nestjs/common";
import { Responser } from "@app/decorators/responser.decorator";
import { MediaService } from "./media.service";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { imageFileFilter, pdfFileFilter } from "@app/utils/upload-file";
import { MediaPaginateQueryDTO, MediasDTO } from "./media.dto";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import { Media } from "./media.model";
import lodash from "lodash";
import {
  QueryParams,
  QueryParamsResult,
} from "@app/decorators/queryparams.decorator";
import { MongooseDoc } from "@app/interfaces/mongoose.interface";
import { TypeState } from "@app/constants/biz.constant";

@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // upload file image
  @Post()
  @Responser.handle("Upload image")
  @UseInterceptors(
    FileInterceptor("thumbnail", { fileFilter: imageFileFilter })
  )
  public async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file)
      throw new BadRequestException("File is not image or no file attached");

    return await this.mediaService.uploadAvatar(file);
  }

  // upload many image
  @Post("multiple")
  @Responser.handle("Upload multiple images")
  @UseInterceptors(
    FilesInterceptor("thumbnail", 20, { fileFilter: imageFileFilter })
  )
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File) {
    if (!files)
      throw new BadRequestException("Files is not image or no file attached");

    return await this.mediaService.uploadMultiple(files);
  }

  // upload file pdf
  @Post("/pdf")
  @Responser.handle("Upload pdf")
  @UseInterceptors(FileInterceptor("file", { fileFilter: pdfFileFilter }))
  public async uploadFilePdf(@UploadedFile() file: Express.Multer.File) {
    if (!file)
      throw new BadRequestException("File is not pdf or no file attached");

    return await this.mediaService.uploadPdf(file);
  }

  // upload file pdf home
  @Post("/upload")
  @Responser.handle("Upload pdf home")
  @UseInterceptors(FileInterceptor("file", { fileFilter: pdfFileFilter }))
  public async uploadPdfHome(@UploadedFile() file: Express.Multer.File) {
    if (!file)
      throw new BadRequestException("File is not pdf or no file attached");

    return await this.mediaService.uploadPdfHome(file);
  }

  // upload file signature
  @Post("/signature")
  @Responser.handle("Upload signature")
  @UseInterceptors(
    FileInterceptor("thumbnail", { fileFilter: imageFileFilter })
  )
  public async uploadSignature(
    @UploadedFile() file: Express.Multer.File,
    @Body() media: Partial<Media>
  ) {
    if (!file)
      throw new BadRequestException("File is not image or no file attached");

    return await this.mediaService.uploadSignature(file, media);
  }

  // get list file pdf
  @Get("/manager")
  @Responser.handle("Get all pdf")
  @Responser.paginate()
  findAllFiles(
    @Query() query: MediaPaginateQueryDTO
  ): Promise<PaginateResult<Media>> {
    const { page, page_size, field, order, status, ...filters } = query;
    const paginateQuery: PaginateQuery<Media> = {};
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword);
      const keywordRegExp = new RegExp(trimmed, "i");
      paginateQuery.$or = [
        { title: keywordRegExp },
        { caption: keywordRegExp },
      ];
    }
    //filter deletedAt = null
    paginateQuery.deletedAt = null;
    //filter type = pdf
    paginateQuery.type = TypeState.Pdf;
    // status
    if (!lodash.isUndefined(status)) {
      const queryState = status.split(",");
      paginateQuery.status = { $in: queryState };
    }
    const paginateOptions: PaginateOptions = { page, pageSize: page_size };
    if (field && order) {
      const setSort = {};
      setSort[field] = order;
      paginateOptions.sort = setSort;
    }
    return this.mediaService.paginator(paginateQuery, paginateOptions);
  }

  // get signatures of file Pdf
  @Get("/manager/signature")
  @Responser.handle("Get signatures of pdf")
  public async getSignaturePdf(): Promise<MongooseDoc<Media>[]> {
    return this.mediaService.getSignaturePdf();
  }

  // get media
  @Get("/manager/:id")
  @Responser.handle("Get pdf")
  public async getFile(@Param("id") mediaID: string): Promise<Media> {
    return this.mediaService.findOne(mediaID);
  }

  // update pdf signed
  @Put("pdf/:id")
  @Responser.handle("Update pdf signed")
  @UseInterceptors(FileInterceptor("file", { fileFilter: pdfFileFilter }))
  public async updatePdfSigned(
    @UploadedFile() file: Express.Multer.File,
    @QueryParams() { params }: QueryParamsResult,
    @Body() media: Partial<Media>
  ): Promise<MongooseDoc<Media>> {
    return this.mediaService.updatePdfSigned(params.id, file, media);
  }

  // update signature
  @Put("signature/:id")
  @Responser.handle("Update signature")
  @UseInterceptors(
    FileInterceptor("thumbnail", { fileFilter: imageFileFilter })
  )
  public async updateSignature(
    @UploadedFile() file: Express.Multer.File,
    @QueryParams() { params }: QueryParamsResult
  ): Promise<MongooseDoc<Media>> {
    if (!file)
      throw new BadRequestException("File is not pdf or no file attached");
    return this.mediaService.updateSignature(params.id, file);
  }

  // update media
  @Put("manager/:id")
  @Responser.handle("Update pdf")
  updateMedia(
    @QueryParams() { params }: QueryParamsResult,
    @Body() media: Partial<Media>
  ): Promise<MongooseDoc<Media>> {
    return this.mediaService.update(params.id, media);
  }

  // delete media
  @Delete("manager/:id")
  @Responser.handle("Delete pdf")
  delMedia(@QueryParams() { params }: QueryParamsResult): Promise<Media> {
    return this.mediaService.delete(params.id);
  }

  // delete many media
  @Delete("manager")
  @Responser.handle("Delete many pdf")
  delMedias(@Body() body: MediasDTO) {
    return this.mediaService.batchDelete(body.mediaIds);
  }
}

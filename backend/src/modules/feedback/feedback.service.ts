/**
 * @file Feedback service
 * @module module/feedback/service
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@app/transformers/model.transformer";
import { MongooseDoc, MongooseModel } from "@app/interfaces/mongoose.interface";
import { Feedback } from "./feedback.model";
import { UserService } from "../user/user.service";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import { FeedbackDTO } from "./feedback.dto";
import { AuthPayload } from "../auth/auth.interface";
import { PublishState } from "@app/constants/biz.constant";
import moment from "moment";
import * as fs from "fs";
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Import the autoTable plugin

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback)
    private readonly feedbackModel: MongooseModel<Feedback>,
    private readonly userService: UserService
  ) {}

  generatePdfFile(): string {
    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(16);
    doc.text("Biểu Đồ Đánh Giá", 14, 16);

    // Define the table content
    const tableColumn = ["STT", "Nội Dung", "Điểm Bình Quân", "Tổng Điểm"];
    const tableRows = [
      ["1", "Nỗ lực thực hiện", "4.5", "5"],
      ["2", "Hợp tác nhóm", "3.5", "4.5"],
      ["3", "Lắng nghe tích cực", "2.0", "3"],
      // More rows can be added here
    ];

    // Add a table to the PDF using autoTable plugin
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: {
        fillColor: [255, 0, 0], // Set header background color
        halign: "center", // Center-align table text
      },
      headStyles: {
        fillColor: [255, 0, 0], // Set header background color
        textColor: [255, 255, 255], // Set header text color to white
      },
      bodyStyles: {
        fillColor: [255, 255, 0], // Set body background color
        textColor: [0, 0, 0], // Set body text color to black
      },
    });

    // Ensure the /mnt/data/ directory exists
    const directory = "/mnt/data";
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Save the file to disk
    const filePath = "/mnt/data/output.pdf";
    fs.writeFileSync(filePath, doc.output());

    return filePath;
  }

  // get list feedbacks
  public async paginator(
    query: PaginateQuery<Feedback>,
    options: PaginateOptions
  ): Promise<PaginateResult<Feedback>> {
    return await this.feedbackModel.paginate(query, {
      ...options,
      lean: true,
    });
  }

  // get list feedbacks
  async listFeedbacks(): Promise<Feedback[]> {
    let feedbacks = await this.feedbackModel
      .find({ status: PublishState.Published, deletedBy: null })
      .exec()
      .then((result) => (result.length ? result : []));

    return feedbacks;
  }

  // create feedback
  public async create(
    feedbackDTO: FeedbackDTO,
    user: AuthPayload
  ): Promise<Feedback> {
    let userInfo = await this.userService.findByUserName(user.userName);

    let time = moment().format("YYYY-MM-DDTHH:mm:ss");
    let dataDTO = {
      form: feedbackDTO.form,
      user: feedbackDTO.user,
      time: time,
      createdBy: userInfo._id,
    };
    return await this.feedbackModel.create(dataDTO);
  }

  // get feedback by id
  async findOne(feedbackID: string): Promise<MongooseDoc<Feedback>> {
    let feedback = await this.feedbackModel
      .findOne({ _id: feedbackID, deletedBy: null })
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(`Phân loại có ID "${feedbackID}" không được tìm thấy.`)
      );
    return feedback;
  }

  // generatePdfFile() {
  //   const doc = new PDFDocument();

  //   // Define the file path
  //   const filePath = "/mnt/data/output.pdf";

  //   // Pipe the PDF to a file
  //   const stream = fs.createWriteStream(filePath);
  //   doc.pipe(stream);

  //   // Add title and styling
  //   doc.fontSize(12).fillColor("black").text("Biểu Đồ Đánh Giá", 100, 20);

  //   // Define the table
  //   this.generateTable(doc, {
  //     headers: ["STT", "Nội Dung", "Điểm Bình Quân", "Tổng Điểm"],
  //     rows: [
  //       ["1", "Nỗ lực thực hiện", "4.5", "5"],
  //       ["2", "Hợp tác nhóm", "3.5", "4.5"],
  //       // More rows here...
  //     ],
  //   });

  //   // Finalize the PDF and end the stream
  //   doc.end();

  //   return filePath;
  // }

  // generateTable(doc, { headers, rows }) {
  //   let startX = 50;
  //   let startY = 100;
  //   const rowHeight = 20;
  //   const columnWidth = 150;

  //   // Draw headers
  //   headers.forEach((header, i) => {
  //     doc
  //       .rect(startX + i * columnWidth, startY, columnWidth, rowHeight)
  //       .stroke();
  //     doc.text(header, startX + i * columnWidth + 10, startY + 5);
  //   });

  //   // Draw rows
  //   rows.forEach((row, rowIndex) => {
  //     row.forEach((cell, cellIndex) => {
  //       doc
  //         .rect(
  //           startX + cellIndex * columnWidth,
  //           startY + (rowIndex + 1) * rowHeight,
  //           columnWidth,
  //           rowHeight
  //         )
  //         .stroke();
  //       doc.text(
  //         cell,
  //         startX + cellIndex * columnWidth + 10,
  //         startY + (rowIndex + 1) * rowHeight + 5
  //       );
  //     });
  //   });
  // }
}

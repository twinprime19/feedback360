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
import {
  FontCustomRobotoBold,
  FontCustomRobotoNormal,
  PublishState,
  QuestionTypeState,
} from "@app/constants/biz.constant";
import { Form } from "../form/form.model";
import { Question } from "../question/question.model";
import moment from "moment";
import * as fs from "fs";
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Import the autoTable plugin
import { Statistic } from "../statistic/statistic.model";
import * as path from "path";
import axios from "axios";

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback)
    private readonly feedbackModel: MongooseModel<Feedback>,
    @InjectModel(Form)
    private readonly formModel: MongooseModel<Form>,
    @InjectModel(Question)
    private readonly questionModel: MongooseModel<Question>,
    @InjectModel(Statistic)
    private readonly statisticModel: MongooseModel<Statistic>,
    private readonly userService: UserService
  ) {}

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
    // let userInfo = await this.userService.findByUserName(user.userName);

    let time = moment().format("YYYY-MM-DDTHH:mm:ss");
    let dataDTO = {
      form: feedbackDTO.form,
      user: feedbackDTO.user,
      time: time,
      // createdBy: userInfo._id,
    };
    return await this.feedbackModel.create(dataDTO);
  }

  // get feedback by id
  async findOne(feedbackID: string): Promise<MongooseDoc<Feedback>> {
    let feedback = await this.feedbackModel
      .findOne({ _id: feedbackID, deletedBy: null })
      .populate([{ path: "form" }, { path: "user" }])
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(`Phân loại có ID "${feedbackID}" không được tìm thấy.`)
      );

    let reviewQuestions = (feedback?.form as any).template?.reviewQuestions;
    let newReviewQuestions: any = [];
    for (let questionID of reviewQuestions) {
      let questionObj = await this.questionModel.findById(questionID);
      newReviewQuestions.push(questionObj);
    }
    (feedback?.form as any).template.reviewQuestions = newReviewQuestions;

    let answerQuestions = (feedback?.form as any).template?.answerQuestions;
    let newAnswerQuestions: any = [];
    for (let questionID of answerQuestions) {
      let questionObj = await this.questionModel.findById(questionID);
      newAnswerQuestions.push(questionObj);
    }
    (feedback?.form as any).template.answerQuestions = newAnswerQuestions;

    return feedback;
  }

  public async generatePdfFile(feedbackID: string) {
    let feedbackInfo = await this.feedbackModel.findById(feedbackID);
    if (!feedbackInfo) throw `Không tìm thấy form.`;

    let formInfo = await this.formModel.findById(feedbackInfo.form);
    if (!formInfo) throw `Không tìm thấy form.`;

    // phân tích kết quả
    let template = formInfo.template;
    let reviewQuestions = template.reviewQuestions;
    let answerQuestions = template.answerQuestions;

    let arrReviewQuestions: any = [];
    let arrAnswerQuestions: any = [];
    let arrQuestions: any = [];

    for (let qid of reviewQuestions) {
      let question = await this.questionModel.findById(qid);
      if (question && question.type === QuestionTypeState.POINT) {
        arrReviewQuestions.push(question);
        arrQuestions.push(question);
      }
    }

    for (let qid of answerQuestions) {
      let question = await this.questionModel.findById(qid);
      if (question && question.type === QuestionTypeState.POINT) {
        arrAnswerQuestions.push(question);
        arrQuestions.push(question);
      }
    }

    let answerStatistics = await this.statisticModel.find({
      feedback: feedbackID,
    });
    console.log("answerStatistics", answerStatistics);

    for (let questionObj of arrQuestions) {
      let newQuestion = {
        id: String(questionObj._id),
        title: questionObj.title,
        type: questionObj.type,
        selfPoint: 0,
        // senior: 0,
        // peer: 0,
        // subordinate: 0,

        senior_detail: {
          one: 0,
          two: 0,
          three: 0,
          four: 0,
          five: 0,
          ko: false,
          tc: true,
        },
        peer_detail: {
          one: 0,
          two: 0,
          three: 0,
          four: 0,
          five: 0,
          ko: false,
          tc: true,
        },
        subordinate_detail: {
          one: 0,
          two: 0,
          three: 0,
          four: 0,
          five: 0,
          ko: false,
          tc: true,
        },
      };
    }

    let rowDatas: any = [];

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // add the font to jsPDF
    doc.addFileToVFS("Roboto.ttf", FontCustomRobotoNormal);
    doc.addFont("Roboto.ttf", "Roboto", "normal");
    doc.addFileToVFS("Roboto1.ttf", FontCustomRobotoBold);
    doc.addFont("Roboto1.ttf", "Roboto", "bold");

    doc.setFontSize(16);
    doc.setFont("Roboto", "bold");

    doc.text("BÁO CÁO KẾT QUẢ PHẢN HỒI 360°", 135, 20, { align: "center" });
    doc.text("Anh …… – Giám Đốc ……", 135, 30, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.text("I. QUY ĐỊNH VỀ BẢO MẬT", 15, 45);
    doc.setFont("Roboto", "normal");
    doc.text(
      "- Báo cáo này chỉ được đọc bởi: Ban Tổng giám đốc, phòng Nhân sự và Người được phản hồi (NĐPH),",
      15,
      55
    );
    doc.text(
      "- Các vi phạm về bảo mật sẽ được xử lý kỹ luật theo nội quy công ty.",
      15,
      60
    );

    // Add second section
    doc.setFont("Roboto", "bold");
    doc.text("II. MỤC TIÊU CỦA VIỆC PHẢN HỒI NÀY", 15, 70);
    doc.setFont("Roboto", "normal");
    doc.text("- Nhằm giúp NĐPH biết được ý kiến góp ý xây dựng của:", 15, 80);
    doc.text(
      "✓Cấp trên: Ghi nhận những nỗ lực đóng góp cũng như những điểm cần phát huy hay cần hoàn thiện của NĐPH,",
      20,
      85
    );
    doc.text(
      "✓Đồng cấp: Nhận xét của các đồng nghiệp cùng cấp trong quá trình phối hợp với NĐPH trong việc cùng hợp tác thực hiện mục tiêu của Công ty,",
      20,
      90
    );
    doc.text(
      "✓Cấp dưới: Ghi nhận, cảm nhận và hiểu về NĐPH ở mức độ nào. Đồng thời thể hiện mong muốn NĐPH (Quản lý) của mình chú ý đến những vấn đề họ chưa cảm nhận được, chưa nắm rõ hoặc những góp ý xây dựng thêm. (Không nhằm mục tiêu nhận xét đúng sai).",
      20,
      95,
      { maxWidth: 265 }
    );

    doc.text("- Kết quả phân tích của Báo cáo này làm cơ sở để NĐPH:", 15, 110);
    doc.text("✓Duy trì và phát huy: những thế mạnh của mình,", 20, 115);
    doc.text(
      "✓Cải thiện: những điểm cần hoàn thiện của mình (nếu có),",
      20,
      120
    );
    doc.text(
      "✓Điều chỉnh, lưu ý hoặc thay đổi phương pháp giao tiếp ứng xử, truyền đạt hiệu quả hơn.",
      20,
      125
    );

    // Add third section
    doc.setFont("Roboto", "bold");
    doc.text("III. KẾT QUẢ", 15, 135);
    doc.setFont("Roboto", "normal");
    doc.text(
      "- Nhận xét của cấp trên gồm: Quản lý trực tiếp và gián tiếp (nếu có);",
      15,
      145
    );
    doc.text(
      "- Nhận xét của đồng cấp gồm: Các đồng cấp thường xuyên phối hợp & một số vị trí tham chiếu thêm;",
      15,
      150
    );
    doc.text(
      "- Nhận xét của cấp dưới gồm: Tất cả nhân viên thuộc bộ phận (trực tiếp và NV gián tiếp nếu có).",
      15,
      155
    );

    doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.text("1. Kết quả thống kê", 15, 20);
    doc.setFont("Roboto", "normal");

    // Define the table content
    const tableColumn = [
      [
        {
          content: "STT",
          colSpan: 1,
          rowSpan: 2,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "Nội dung",
          colSpan: 1,
          rowSpan: 2,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "Điểm Bình Quân",
          colSpan: 4,
          rowSpan: 1,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "Tổng Điểm",
          colSpan: 21,
          rowSpan: 1,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
      ],
      [
        {
          content: "Tự đánh giá",
          colSpan: 1,
          rowSpan: 1,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [146, 208, 80],
          },
        },
        {
          content: "Cấp trên",
          colSpan: 1,
          rowSpan: 1,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [0, 176, 80],
          },
        },
        {
          content: "Ngang cấp",
          colSpan: 1,
          rowSpan: 1,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 255, 0],
          },
        },
        {
          content: "Cấp dưới",
          colSpan: 1,
          rowSpan: 1,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [0, 176, 240],
          },
        },

        {
          content: "Cấp trên",
          colSpan: 7,
          rowSpan: 1,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 192, 0],
          },
        },
        {
          content: "Ngang cấp",
          colSpan: 7,
          rowSpan: 1,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [219, 219, 219],
          },
        },
        {
          content: "Cấp dưới",
          colSpan: 7,
          rowSpan: 1,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [146, 208, 80],
          },
        },
      ],
      [
        {
          content: "Thang điểm từ 1 đến 5",
          colSpan: 2,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 255, 0],
          },
        },

        {
          content: "",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [146, 208, 80],
          },
        },
        {
          content: "",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [0, 176, 80],
          },
        },
        {
          content: "",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 255, 0],
          },
        },
        {
          content: "",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [0, 176, 240],
          },
        },

        {
          content: "1",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 192, 0],
          },
        },
        {
          content: "2",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 192, 0],
          },
        },
        {
          content: "3",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 192, 0],
          },
        },
        {
          content: "4",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 192, 0],
          },
        },
        {
          content: "5",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 192, 0],
          },
        },
        {
          content: "Ko TC",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 192, 0],
          },
        },
        {
          content: "TC",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 192, 0],
          },
        },

        {
          content: "1",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [219, 219, 219],
          },
        },
        {
          content: "2",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [219, 219, 219],
          },
        },
        {
          content: "3",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [219, 219, 219],
          },
        },
        {
          content: "4",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [219, 219, 219],
          },
        },
        {
          content: "5",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [219, 219, 219],
          },
        },
        {
          content: "Ko TC",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [219, 219, 219],
          },
        },
        {
          content: "TC",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [219, 219, 219],
          },
        },

        {
          content: "1",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [146, 208, 80],
          },
        },
        {
          content: "2",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [146, 208, 80],
          },
        },
        {
          content: "3",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [146, 208, 80],
          },
        },
        {
          content: "4",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [146, 208, 80],
          },
        },
        {
          content: "5",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [146, 208, 80],
          },
        },
        {
          content: "Ko TC",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [146, 208, 80],
          },
        },
        {
          content: "TC",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [146, 208, 80],
          },
        },
      ],
      [
        {
          content: "NGUYỄN ĐÌNH TRƯỜNG",
          colSpan: 27,
          styles: { halign: "left", valign: "middle" },
        },
      ],
    ];

    const tableRows = [
      [
        "1",
        "Nỗ lực thực hiện hoàn thành mục tiêu của Phòng/bộ phận",
        "4.0",
        "4.5",
        "4.4",
        "5.0",

        "",
        "",
        "",
        "1",
        "1",
        "",
        "2",

        "",
        "",
        "1",
        "1",
        "3",
        "1",
        "6",

        "",
        "",
        "",
        "",
        "2",
        "",
        "2",
      ],
      [
        "2",
        "Luôn hợp tác, hay khuyến khích sự hợp tác để hoàn thành mục tiêu chung của Công ty",
        "2.0",
        "3.0",
        "3.8",
        "4.5",

        "",
        "",
        "2",
        "",
        "",
        "",
        "2",

        "",
        "",
        "3",
        "1",
        "2",
        "",
        "6",

        "",
        "",
        "",
        "1",
        "1",
        "",
        "2",
      ],
      [
        "3",
        "Lắng nghe tích cực, sẵn sàng trao đổi dựa trên sự thấu hiểu",
        "2.0",
        "2.5",
        "3.3",
        "4.0",

        "",
        "1",
        "1",
        "",
        "",
        "",
        "2",

        "1",
        "",
        "2",
        "2",
        "1",
        "",
        "6",

        "",
        "",
        "",
        "2",
        "",
        "",
        "2",
      ],
      [
        "4",
        "Luôn tạo cơ hội, khuyến khích người khác/nhân viên đóng góp ý kiến trong công việc",
        "3.0",
        "2.5",
        "3.8",
        "4.0",

        "",
        "1",
        "1",
        "",
        "",
        "",
        "2",

        "",
        "",
        "1",
        "3",
        "",
        "2",
        "6",

        "",
        "",
        "",
        "2",
        "",
        "",
        "2",
      ],
      [
        "5",
        "Truyền cảm hứng cho người khác/ nhân viên thông qua việc công nhận/ tưởng thưởng kết quả đóng góp/ làm việc của họ",
        "2.0",
        "2.5",
        "3.3",
        "3.5",

        "",
        "1",
        "1",
        "",
        "",
        "",
        "2",

        "",
        "1",
        "2",
        "3",
        "",
        "",
        "6",

        "",
        "",
        "1",
        "1",
        "",
        "",
        "2",
      ],
      [
        "6",
        "Phân công công việc một cách hiệu quả",
        "4.0",
        "3.5",
        "4.0",
        "4.0",

        "",
        "",
        "1",
        "1",
        "",
        "",
        "2",

        "",
        "",
        "",
        "1",
        "",
        "5",
        "6",

        "",
        "",
        "",
        "2",
        "",
        "",
        "2",
      ],

      [
        "7",
        "Thể hiện tính cương quyết, không chần chừ, dám nhận trách nhiệm",
        "4.0",
        "4.0",
        "3.6",
        "4.5",

        "",
        "",
        "",
        "2",
        "",
        "",
        "2",

        "",
        "1",
        "",
        "4",
        "",
        "1",
        "6",

        "",
        "",
        "",
        "1",
        "1",
        "",
        "2",
      ],

      [
        "8",
        "Luôn cải tiến, động viên và thúc đẩy sự thay đổi trong công việc để đạt hiệu quả cao hơn",
        "3.0",
        "3.0",
        "4.2",
        "4.5",

        "",
        "",
        "2",
        "",
        "",
        "",
        "2",

        "",
        "",
        "1",
        "2",
        "2",
        "1",
        "6",

        "",
        "",
        "",
        "1",
        "1",
        "",
        "2",
      ],
      [
        "9",
        "Mức độ hứng khởi của anh/ chị khi làm việc với NĐPH",
        "",
        "4.0",
        "4.0",
        "4.0",

        "",
        "",
        "",
        "2",
        "",
        "",
        "2",

        "",
        "1",
        "1",
        "1",
        "3",
        "",
        "6",

        "",
        "",
        "",
        "2",
        "",
        "",
        "2",
      ],
    ];

    // Add a table to the PDF using autoTable plugin
    (doc as any).autoTable({
      head: tableColumn,
      body: tableRows,
      startY: 25,
      styles: {
        fontSize: 10,
        font: "Roboto", // Use the custom font for the table
        fillColor: [255, 255, 255], // Set header background color
        textColor: [0, 0, 0], // Set header text color
        halign: "center", // Center-align table text
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
      },
      headStyles: {
        fontStyle: "bold", // Make the header bold
        fillColor: [255, 255, 255], // Set header background color
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
      },
      bodyStyles: {
        fillColor: [255, 255, 255], // Set header background color
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      columnStyles: {
        1: { halign: "left" },
        2: { fillColor: [146, 208, 80] },
        3: { fillColor: [0, 176, 80] },
        4: { fillColor: [255, 255, 0] },
        5: { fillColor: [0, 176, 240] },

        6: { fillColor: [255, 192, 0] },
        7: { fillColor: [255, 192, 0] },
        8: { fillColor: [255, 192, 0] },
        9: { fillColor: [255, 192, 0] },
        10: { fillColor: [255, 192, 0] },
        11: { fillColor: [255, 192, 0] },
        12: { fillColor: [255, 192, 0] },

        13: { fillColor: [219, 219, 219] },
        14: { fillColor: [219, 219, 219] },
        15: { fillColor: [219, 219, 219] },
        16: { fillColor: [219, 219, 219] },
        17: { fillColor: [219, 219, 219] },
        18: { fillColor: [219, 219, 219] },
        19: { fillColor: [219, 219, 219] },

        20: { fillColor: [146, 208, 80] },
        21: { fillColor: [146, 208, 80] },
        22: { fillColor: [146, 208, 80] },
        23: { fillColor: [146, 208, 80] },
        24: { fillColor: [146, 208, 80] },
        25: { fillColor: [146, 208, 80] },
        26: { fillColor: [146, 208, 80] },
      },
      // didParseCell: function (data) {
      //   if (data.cell.text.length > 0) {
      //     data.cell.styles.cellWidth = "auto"; // Cho phép điều chỉnh chiều rộng tự động
      //   }
      // },
    });

    doc.text("Ghi chú:", 15, 180);
    doc.text("- Ko: Số người không ý kiến ở tiêu chí đánh giá đó;", 35, 180);
    doc.text("- TC: Tổng cộng số người tham gia phản hồi.", 35, 185);

    doc.addPage("a4", "l");
    doc.setFontSize(12);

    doc.setFont("Roboto", "bold");
    doc.text("2. Những điểm mạnh nổi bật của NĐPN", 15, 20);
    doc.text("a/ Nhận xét của cấp trên:", 20, 25);
    doc.setFont("Roboto", "normal");
    doc.text("- Thông minh, nhanh,", 20, 30);
    doc.text("- Có nhiều kiến thức chuyên môn,", 20, 35);
    doc.text("- Có những mối quan hệ trong lĩnh vực phụ trách.", 20, 40);

    doc.setFont("Roboto", "bold");
    doc.text("b/ Nhận xét của đồng nghiệp đồng cấp:", 20, 45);
    doc.setFont("Roboto", "normal");
    doc.text(
      "- Khả năng phân tích nắm bắt nhanh thị trường, nhiều kinh nghiệm,",
      20,
      50
    );
    doc.text("- Xử lý công việc nhanh,", 20, 55);
    doc.text(
      "- Nhanh nhẹn, tích cực đóng góp ý kiến xây dựng (2 ý kiến),",
      20,
      60
    );
    doc.text("- Năng động, tự tin, thông minh,", 20, 65);
    doc.text(
      "- Nắm rõ hoạt động đầu tư, quy trình, chính sách của cty.",
      20,
      70
    );

    doc.setFont("Roboto", "bold");
    doc.text("c/ Nhận xét của cấp dưới:", 20, 75);
    doc.setFont("Roboto", "normal");
    doc.text("- Luôn nỗ lực hoàn thành mục tiêu được giao,", 20, 80);
    doc.text("- Tinh thần trách nhiệm cao, ", 20, 85);
    doc.text("- Quyết liệt trong công việc,", 20, 90);
    doc.text("- Thông minh, giỏi kiến thức,", 20, 95);
    doc.text("- Hòa đồng với nhân viên.", 20, 100);

    doc.setFont("Roboto", "bold");
    doc.text("3. Vấn đề mà NĐPH cần hoàn thiện ngay", 15, 110);
    doc.text("a/ Nhận xét của cấp trên:", 20, 115);
    doc.setFont("Roboto", "normal");
    doc.text("- Tập trung hơn trong cuộc họp (bớt xem điện thoại),", 20, 120);
    doc.text("- Cư xử với mọi người điềm đạm hơn,", 20, 125);
    doc.text("- Lắng nghe tích cực,", 20, 130);
    doc.text("- Giảm cân.", 20, 135);

    doc.setFont("Roboto", "bold");
    doc.text("b/ Nhận xét của đồng nghiệp đồng cấp:", 20, 140);
    doc.setFont("Roboto", "normal");
    doc.text(
      "- Giảm bớt việc công bố thông tin ngoài lề của các phòng ban khác,",
      20,
      145
    );
    doc.text("- Tránh cá nhân hóa các sự việc chung,", 20, 150);
    doc.text(
      "- Cần bình tĩnh, không nôn nóng thúc giục giải quyết khi vấn đề chưa rõ ràng.",
      20,
      155
    );

    doc.setFont("Roboto", "bold");
    doc.text("c/ Nhận xét của cấp dưới:", 20, 160);
    doc.setFont("Roboto", "normal");
    doc.text("- Cần nhẹ nhàng với các phòng ban khác.", 20, 165);

    doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.text("4. Lời khuyên dành cho NĐPH", 15, 20);
    doc.text("a/ Nhận xét của cấp trên:", 20, 25);
    doc.setFont("Roboto", "normal");
    doc.text("- Bình tĩnh để đọc vị cuộc họp,", 20, 30);
    doc.text("- Bớt đanh đá,", 20, 35);
    doc.text("- Kiểm soát cảm xúc khi giao tiếp.", 20, 40);

    doc.setFont("Roboto", "bold");
    doc.text("b/ Nhận xét của đồng nghiệp đồng cấp:", 20, 45);
    doc.setFont("Roboto", "normal");
    doc.text(
      "- Khéo léo hơn trong nhận xét ngoài chuyên môn của các phòng ban khác,",
      20,
      50
    );
    doc.text(
      "- Tăng cường kết nối các bộ phận để dự án đạt hiệu quả cao nhất,",
      20,
      55
    );
    doc.text("- Tôn trọng hơn các ý kiến trái chiều.", 20, 60);

    doc.setFont("Roboto", "bold");
    doc.text("c/ Nhận xét của cấp dưới:", 20, 65);
    doc.setFont("Roboto", "normal");
    doc.text("- Nhẹ nhàng khuyên, chỉ bảo nhân viên hơn.", 20, 70);

    // Add third section
    doc.setFont("Roboto", "bold");
    doc.text("III. PHÂN TÍCH TỔNG QUÁT", 15, 80);

    doc.text("Giám đốc ......", 50, 90);
    doc.setFont("Roboto", "normal");

    // Tạo bảng với tiêu đề và màu sắc
    const head2Rows = [
      [
        {
          content: "Tiêu Chí Số",
          styles: {
            halign: "center",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "1",
          styles: {
            halign: "center",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "2",
          styles: {
            halign: "center",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "3",
          styles: {
            halign: "center",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "4",
          styles: {
            halign: "center",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "5",
          styles: {
            halign: "center",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "6",
          styles: {
            halign: "center",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "7",
          styles: {
            halign: "center",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "8",
          styles: {
            halign: "center",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "9",
          styles: {
            halign: "center",
            fillColor: [255, 0, 0],
            textColor: [255, 255, 255],
          },
        },
      ],
      // Thêm các hàng khác giống như trong hình ảnh
    ];

    const table2Rows = [
      [
        "Tự đánh giá",
        "4.0",
        "2.0",
        "2.0",
        "3.0",
        "2.0",
        "4.0",
        "4.0",
        "3.0",
        "",
      ],
      [
        "Cấp trên",
        "4.5",
        "3.0",
        "2.5",
        "2.5",
        "2.5",
        "3.5",
        "4.0",
        "3.0",
        "4.0",
      ],
      [
        "Ngang cấp",
        "4.4",
        "3.8",
        "3.3",
        "3.8",
        "3.3",
        "4.0",
        "3.6",
        "4.2",
        "4.0",
      ],
      [
        "Cấp dưới",
        "5.0",
        "4.5",
        "4.0",
        "4.0",
        "3.5",
        "4.0",
        "4.5",
        "4.5",
        "4.0",
      ],
    ];

    // Thêm bảng vào PDF
    (doc as any).autoTable({
      head: head2Rows,
      body: table2Rows,
      startY: 95,
      styles: {
        fontSize: 10,
        font: "Roboto", // Use the custom font for the table
        fillColor: [255, 255, 255], // Set header background color
        textColor: [0, 0, 0], // Set header text color
        halign: "center", // Center-align table text
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
      },
      headStyles: {
        fillColor: [255, 0, 0], // Màu nền tiêu đề
      },
      // alternateRowStyles: {
      //   fillColor: [240, 240, 240], // Màu nền cho hàng chẵn
      // },
      columnStyles: {
        0: { halign: "left" },
      },
      // Hàm để thay đổi màu nền cho từng hàng
      didParseCell: function (data) {
        if (data.section === "body") {
          // Áp dụng màu nền cho từng hàng theo chỉ số index của row
          if (data.row.index === 0) {
            data.cell.styles.fillColor = [146, 208, 80]; // Hàng đầu tiên - xanh nhạt
          } else if (data.row.index === 1) {
            data.cell.styles.fillColor = [0, 176, 80]; // Hàng thứ hai - xanh lá đậm
          } else if (data.row.index === 2) {
            data.cell.styles.fillColor = [255, 255, 0]; // Hàng thứ ba - vàng
          } else if (data.row.index === 3) {
            data.cell.styles.fillColor = [0, 176, 240]; // Hàng thứ tư - xanh dương
          }
        }
      },
      tableWidth: 105, // Đặt chiều rộng của bảng bằng 50% chiều ngang trang A4 (105 mm)
    });

    // chèn biểu đồ từ hình ảnh
    // Cấu hình yêu cầu API QuickChart
    const chartConfig = {
      type: "line",
      data: {
        labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
        datasets: [
          {
            label: "Tự đánh giá",
            data: [4.0, 2.0, 2.0, 3.0, 2.0, 4.0, 4.0, 3.0, 0],
            borderColor: "rgb(146, 208, 80)",
            fill: false,
          },
          {
            label: "Cấp trên",
            data: [4.5, 3.0, 2.5, 2.5, 2.5, 3.5, 4.0, 3.0, 4.0],
            borderColor: "rgb(0, 176, 80)",
            fill: false,
          },
          {
            label: "Ngang cấp",
            data: [4.4, 3.8, 3.3, 3.8, 3.3, 4.0, 3.6, 4.2, 4.0],
            borderColor: "rgb(255, 255, 0)",
            fill: false,
          },
          {
            label: "Cấp dưới",
            data: [5.0, 4.5, 4.0, 4.0, 3.5, 4.0, 4.5, 4.5, 4.0],
            borderColor: "rgb(0, 176, 240)",
            fill: false,
          },
        ],
      },
    };

    const response = await axios.post("https://quickchart.io/chart/create", {
      chart: chartConfig,
      width: 600,
      height: 400,
    });

    // Tải xuống hình ảnh từ URL mà QuickChart trả về
    const imageUrl = response.data.url;
    // Ensure the /mnt/data/ directory exists
    const directory1 = "./assets/uploads/chart";
    if (!fs.existsSync(directory1)) {
      fs.mkdirSync(directory1, { recursive: true });
    }
    const imagePath = path.join(
      "./assets/uploads/chart",
      "quickchart-image.png"
    );
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    fs.writeFileSync(imagePath, imageResponse.data);

    // Tạo PDF và chèn hình ảnh vào
    const imageData = fs.readFileSync(imagePath).toString("base64");
    doc.addImage(
      `data:image/png;base64,${imageData}`,
      "PNG",
      130,
      85,
      150,
      100
    );

    // Tạo bảng với tiêu đề và màu sắc
    const head3Rows = [
      [
        {
          content: "STT",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 192, 0],
            textColor: [255, 255, 255],
          },
        },
        {
          content: "Nội dung tiêu chí",
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: [255, 192, 0],
            textColor: [255, 255, 255],
          },
        },
      ],
      // Thêm các hàng khác giống như trong hình ảnh
    ];

    const table3Rows = [
      ["1", "Nỗ lực thực hiện hoàn thành mục tiêu của Phòng/bộ phận"],
      [
        "2",
        "Luôn hợp tác, hay khuyến khích sự hợp tác để hoàn thành mục tiêu chung của Công ty",
      ],
      ["3", "Lắng nghe tích cực, sẵn sàng trao đổi dựa trên sự thấu hiểu"],
      [
        "4",
        "Luôn tạo cơ hội, khuyến khích người khác/ nhân viên đóng góp ý kiến trong công việc",
      ],
      [
        "5",
        "Truyền cảm hứng cho người khác/ nv thông qua việc công nhận/tưởng thưởng kết quả đóng góp/làm việc của họ",
      ],
      ["6", "Phân công công việc một cách hiệu quả"],
      ["7", "Thể hiện tính cương quyết, không chần chừ, dám nhận trách nhiệm"],
      [
        "8",
        "Luôn cải tiến, động viên và thúc đẩy sự thay đổi trong công việc để đạt hiệu quả cao hơn",
      ],
      ["9", "Mức độ hứng khởi của anh/ chị khi làm việc với người này"],
    ];

    doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "normal");

    // Thêm bảng vào PDF
    (doc as any).autoTable({
      head: head3Rows,
      body: table3Rows,
      startY: 20,
      styles: {
        fontSize: 10,
        font: "Roboto", // Use the custom font for the table
        fillColor: [255, 255, 255], // Set header background color
        textColor: [0, 0, 0], // Set header text color
        halign: "center", // Center-align table text
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
      },
      headStyles: {
        fillColor: [255, 0, 0], // Màu nền tiêu đề
      },
      // alternateRowStyles: {
      //   fillColor: [240, 240, 240], // Màu nền cho hàng chẵn
      // },
      bodyStyles: {
        fillColor: [216, 216, 216], // Set header background color
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
      },
      columnStyles: {
        0: { halign: "center" },
        1: { halign: "left" },
      },
      // Hàm để thay đổi màu nền cho từng hàng
      didParseCell: function (data) {
        if (data.section === "body") {
          // Áp dụng màu nền cho từng hàng
          data.cell.styles.fillColor = [216, 216, 216]; // xám nhạt
        }
      },
    });

    doc.setFont("Roboto", "bold");
    doc.text("Nhận xét chung cho NĐPH:", 15, 105);
    doc.setFont("Roboto", "normal");
    doc.text(
      "Bạn hiểu & tự đoán biết được khá tương đồng với mọi người xung quanh & nhận ra điểm cần lưu ý về lắng nghe tích cực & truyền cảm hứng cho người khác để càng thành công hơn (tiêu chí số 3 & số 5).",
      15,
      110,
      { maxWidth: 265 }
    );

    // Ensure the /mnt/data/ directory exists
    const directory = "./assets/uploads/pdf";
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // // Save the file to disk
    // const filePath = "./assets/uploads/pdf/report.pdf";
    // fs.writeFileSync(filePath, doc.output());

    // return filePath;

    // Lưu PDF vào buffer
    const pdfBuffer = doc.output("arraybuffer");
    return Buffer.from(pdfBuffer);
  }
}

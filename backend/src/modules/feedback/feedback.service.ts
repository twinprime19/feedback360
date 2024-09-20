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
  FontCustom,
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
    doc.addFileToVFS("MyFont.ttf", FontCustom);
    doc.addFont("MyFont.ttf", "MyFont", "normal");
    doc.setFont("MyFont");

    // Add Title
    doc.setFontSize(14);

    doc.text("BÁO CÁO KẾT QUẢ PHẢN HỒI 360°", 135, 20, { align: "center" });
    doc.text("Anh …… – Giám Đốc ……", 135, 30, { align: "center" });

    doc.setFontSize(12);
    // Add first section (with yellow highlight)
    doc.setFont("MyFont");
    doc.text("I. QUY ĐỊNH VỀ BẢO MẬT", 15, 47);
    doc.setFont("MyFont");
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
    doc.setFont("MyFont");
    doc.text("II. MỤC TIÊU CỦA VIỆC PHẢN HỒI NÀY", 15, 75);
    doc.setFont("MyFont");
    doc.text("- Nhằm giúp NĐPH biết được ý kiến góp ý xây dựng của:", 15, 85);
    doc.text(
      "✓ Cấp trên: Ghi nhận những nỗ lực đóng góp cũng như những điểm cần phát huy hay cần hoàn thiện của NĐPH.",
      20,
      90
    );
    doc.text(
      "✓ Đồng cấp: Nhận xét của các đồng nghiệp cùng cấp trong quá trình phối hợp với NĐPH trong việc cùng hợp tác thực hiện mục tiêu của Công ty.",
      20,
      95
    );
    doc.text(
      "✓ Cấp dưới: Ghi nhận, cảm nhận và hiểu về NĐPH ở mức độ nào. Đồng thời thể hiện mong muốn NĐPH (Quản lý) của mình chú ý đến những vấn",
      20,
      100
    );
    doc.text(
      " đề họ chưa cảm nhận được, chưa nắm rõ hoặc những góp ý xây dựng thêm. (Không nhằm mục tiêu nhận xét đúng sai).",
      20,
      105
    );
    doc.text("- Kết quả phân tích của Báo cáo này làm cơ sở để NĐPH:", 15, 110);
    doc.text("✓ Duy trì và phát huy: những thế mạnh của mình.", 20, 115);
    doc.text(
      "✓ Cải thiện: những điểm cần hoàn thiện của mình (nếu có).",
      20,
      120
    );
    doc.text(
      "✓ Điều chỉnh, lưu ý hoặc thay đổi phương pháp giao tiếp ứng xử, truyền đạt hiệu quả hơn.",
      20,
      125
    );

    // Add third section
    doc.setFont("MyFont");
    doc.text("III. KẾT QUẢ", 15, 140);
    doc.setFont("MyFont");
    doc.text(
      "- Nhận xét của cấp trên gồm: Quản lý trực tiếp và gián tiếp (nếu có).",
      15,
      150
    );
    doc.text(
      "- Nhận xét của đồng cấp gồm: Các đồng cấp thường xuyên phối hợp & một số vị trí tham chiếu thêm.",
      15,
      155
    );
    doc.text(
      "- Nhận xét của cấp dưới gồm: Tất cả nhân viên thuộc bộ phận (trực tiếp và NV gián tiếp nếu có).",
      15,
      160
    );

    doc.text("1. Kết quả thống kê", 15, 300);

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
            fontStyle: "bold",
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
            fontStyle: "bold",
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
            fontStyle: "bold",
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
            fontStyle: "bold",
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
      startY: 320,
      styles: {
        fontSize: 12,
        font: "MyFont", // Use the custom font for the table
        fillColor: [255, 255, 255], // Set header background color
        textColor: [0, 0, 0], // Set header text color
        halign: "center", // Center-align table text
        lineWidth: 0.2, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
      },
      headStyles: {
        fontStyle: "bold", // Make the header bold
        fillColor: [255, 255, 255], // Set header background color
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.2, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
      },
      bodyStyles: {
        fillColor: [255, 255, 255], // Set header background color
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.2, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
      },
      columnStyles: {
        1: { halign: "left" }, // Column 1 ('Nội Dung') is aligned to the left in the body
      },
      // didParseCell: function (data) {
      //   if (data.cell.text.length > 0) {
      //     data.cell.styles.cellWidth = "auto"; // Cho phép điều chỉnh chiều rộng tự động
      //   }
      // },
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
}

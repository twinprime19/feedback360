/**
 * @file Form service
 * @module module/form/service
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@app/transformers/model.transformer";
import { MongooseDoc, MongooseModel } from "@app/interfaces/mongoose.interface";
import { Form } from "./form.model";
import { UserService } from "../user/user.service";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import { FormDTO } from "./form.dto";
import { AuthPayload } from "../auth/auth.interface";
import {
  FontCustomRobotoBold,
  FontCustomRobotoNormal,
  GenderState,
  PublishState,
  QuestionTypeState,
  RelationshipState,
} from "@app/constants/biz.constant";
import { Template } from "../template/template.model";
import { Question } from "../question/question.model";
import moment from "moment";
import * as fs from "fs";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Feedback } from "../feedback/feedback.model";
import * as path from "path";
import axios from "axios";
import { User } from "../user/entities/user.entity";
import { EmailService } from "@app/processors/helper/helper.service.email";
import { sendForm } from "@app/utils/template-email";
import * as APP_CONFIG from "@app/app.config";
import { FormRelationship } from "../form_relationship/form_relationship.model";

@Injectable()
export class FormService {
  constructor(
    @InjectModel(Form)
    private readonly formModel: MongooseModel<Form>,
    @InjectModel(Template)
    private readonly templateModel: MongooseModel<Template>,
    @InjectModel(Question)
    private readonly questionModel: MongooseModel<Question>,
    @InjectModel(Feedback)
    private readonly feedbackModel: MongooseModel<Feedback>,
    @InjectModel(FormRelationship)
    private readonly formRelationshipModel: MongooseModel<FormRelationship>,
    private readonly userService: UserService,
    private readonly emailService: EmailService
  ) {}

  // get list forms
  public async paginator(
    query: PaginateQuery<Form>,
    options: PaginateOptions
  ): Promise<PaginateResult<Form>> {
    return await this.formModel.paginate(query, {
      ...options,
      lean: true,
    });
  }

  // get list forms
  async listForms(): Promise<Form[]> {
    let forms = await this.formModel
      .find({ status: PublishState.Published, deletedBy: null })
      .exec()
      .then((result) => (result.length ? result : []));

    return forms;
  }

  // create form
  public async create(formDTO: FormDTO, user: AuthPayload): Promise<Form> {
    let userInfo = await this.userService.findByUserName(user.userName);

    let time = moment().format("YYYY-MM-DDTHH:mm:ss");
    let templateEmail = `<p>Xin chào anh/chị,</p>
                            <p>Tiến Phước kính mời anh chị tham gia khảo sát phản hồi cho nhân sự: <strong>[USER_FULLNAME]</strong>.</p>
                            <p>Anh chị vui lòng nhấp vào liên kết bên dưới để thực hiện khảo sát:</p>
                            <p><a href="[LINK]" style="background-color: #2d4432; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Tham gia khảo sát</a></p>
                            <p>Trân trọng cảm ơn!</p>`;
    let dataDTO = {
      template: formDTO.template,
      user: formDTO.user,
      time: time,
      templateEmail: templateEmail,
      createdBy: userInfo._id,
    };
    return await this.formModel.create(dataDTO);
  }

  // send form
  public async sendForm(
    formID: string,
    listEmailAddress: string[],
    relationship: number,
    user: AuthPayload
  ) {
    let userInfo = await this.userService.findByUserName(user.userName);

    let formInfo = await this.formModel.findById(formID).populate("user");
    if (!formInfo) throw `Không tìm thấy biểu mẫu`;

    let fullname = (formInfo.user as User).fullname;
    let feedbackUserID = (formInfo.user as MongooseDoc<User>)._id;

    let time = moment().format("YYYY-MM-DDTHH:mm:ss");
    let templateEmail = formInfo.templateEmail;

    let data = {
      form: formID,
      relationship: relationship,
      user: feedbackUserID,
      receivers: listEmailAddress,
      time: time,
      templateEmail: templateEmail,
      isSubmitted: false,
      createdBy: userInfo._id,
    };

    let formRelationshipInfo = await this.formRelationshipModel.create(data);

    for (let emailAddress of listEmailAddress) {
      let url = `${APP_CONFIG.APP.FE_URL}/form/${formRelationshipInfo._id}`;
      let to = emailAddress;
      let subject = `${APP_CONFIG.APP.NAME} - Mời tham gia khảo sát phản hồi cho nhân sự`;
      templateEmail = templateEmail
        .replace("[USER_FULLNAME]", fullname)
        .replace("[LINK]", url);
      // let html = sendForm(fullname, url);
      let html = sendForm(templateEmail);

      // send email
      this.emailService.sendMail({ to, subject, text: "", html });
    }

    return true;
  }

  // get form by id
  async findOne(formID: string): Promise<MongooseDoc<Form>> {
    let form = await this.formModel
      .findOne({ _id: formID, deletedBy: null })
      .populate([{ path: "template" }, { path: "user" }])
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(`Biểu mẫu có ID "${formID}" không được tìm thấy.`)
      );

    let reviewQuestions = (form?.template as any).template?.reviewQuestions;
    let newReviewQuestions: any = [];
    for (let questionID of reviewQuestions) {
      let questionObj = await this.questionModel.findById(questionID);
      newReviewQuestions.push(questionObj);
    }
    (form?.template as any).template.reviewQuestions = newReviewQuestions;

    let answerQuestions = (form?.template as any).template?.answerQuestions;
    let newAnswerQuestions: any = [];
    for (let questionID of answerQuestions) {
      let questionObj = await this.questionModel.findById(questionID);
      newAnswerQuestions.push(questionObj);
    }
    (form?.template as any).template.answerQuestions = newAnswerQuestions;

    return form;
  }

  // get form by id của form relationship
  async getForm(formID: string): Promise<MongooseDoc<any>> {
    let formRelationshipInfo = await this.formRelationshipModel
      .findOne({ _id: formID, deletedBy: null })
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(`Biểu mẫu có ID "${formID}" không được tìm thấy.`)
      );

    let form = await this.formModel
      .findOne({ _id: formRelationshipInfo.form, deletedBy: null })
      .populate([
        {
          path: "template",
          select: {
            _id: 1,
            id: 1,
            title: 1,
            template: 1,
          },
        },
        {
          path: "user",
          select: {
            _id: 1,
            id: 1,
            userName: 1,
            fullname: 1,
            emailAddress: 1,
            position: 1,
          },
        },
      ])
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(`Biểu mẫu có ID "${formID}" không được tìm thấy.`)
      );

    let reviewQuestions = (form?.template as any).template?.reviewQuestions;
    let newReviewQuestions: any = [];
    for (let questionID of reviewQuestions) {
      let questionObj = await this.questionModel.findById(questionID);
      newReviewQuestions.push(questionObj);
    }
    (form?.template as any).template.reviewQuestions = newReviewQuestions;

    let answerQuestions = (form?.template as any).template?.answerQuestions;
    let newAnswerQuestions: any = [];
    for (let questionID of answerQuestions) {
      let questionObj = await this.questionModel.findById(questionID);
      newAnswerQuestions.push(questionObj);
    }
    (form?.template as any).template.answerQuestions = newAnswerQuestions;

    let relationship = formRelationshipInfo.relationship;
    (form as any).relationship = relationship;

    return form;
  }

  // get relationship của form
  async getRelationship(formID: string): Promise<MongooseDoc<any>> {
    let formRelationshipInfo = await this.formRelationshipModel
      .findOne({ _id: formID, deletedBy: null })
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(`Biểu mẫu có ID "${formID}" không được tìm thấy.`)
      );

    return formRelationshipInfo;
  }

  // xuất báo cáo pdf
  public async generatePdfFile(formID: string) {
    let formInfo = await this.formModel.findById(formID).populate("user");
    if (!formInfo) throw `Không tìm thấy form.`;

    let templateInfo = await this.templateModel.findById(formInfo.template);
    if (!templateInfo) throw `Không tìm thấy template.`;

    // phân tích kết quả
    let template = templateInfo.template;
    let reviewQuestions = template.reviewQuestions;
    let answerQuestions = template.answerQuestions;

    let arrReviewQuestions: any = [];
    let arrAnswerQuestions: any = [];

    for (let qid of reviewQuestions) {
      let question = await this.questionModel.findById(qid);
      if (question && question.type === QuestionTypeState.POINT)
        arrReviewQuestions.push(question);
      else arrAnswerQuestions.push(question);
    }

    for (let qid of answerQuestions) {
      let question = await this.questionModel.findById(qid);
      if (question && question.type === QuestionTypeState.POINT)
        arrReviewQuestions.push(question);
      else arrAnswerQuestions.push(question);
    }

    let userFeedbacks = await this.feedbackModel.find({
      form: formID,
    });

    // câu hỏi chấm điểm
    let statisticReviewQuestions: any = [];
    let indexQuestion = 0;
    for (let questionObj of arrReviewQuestions) {
      indexQuestion = indexQuestion + 1;

      let arrFeedbacks: any = [];
      for (let feedback of userFeedbacks) {
        let filterQuestion = feedback.feedbackData.find(
          (ele) => ele.id === String(questionObj._id)
        );
        arrFeedbacks.push(filterQuestion);
      }

      let selfPoint = 0;
      let totalSeniorPoint = 0;
      let totalPeerPoint = 0;
      let totalSubordinatePoint = 0;

      let countSeniorOne = 0;
      let countSeniorTwo = 0;
      let countSeniorThree = 0;
      let countSeniorFour = 0;
      let countSeniorFive = 0;
      let countSeniorKO = 0;
      let countSeniorTC = 0;

      let countPeerOne = 0;
      let countPeerTwo = 0;
      let countPeerThree = 0;
      let countPeerFour = 0;
      let countPeerFive = 0;
      let countPeerKO = 0;
      let countPeerTC = 0;

      let countSubordinateOne = 0;
      let countSubordinateTwo = 0;
      let countSubordinateThree = 0;
      let countSubordinateFour = 0;
      let countSubordinateFive = 0;
      let countSubordinateKO = 0;
      let countSubordinateTC = 0;

      for (let feedback of arrFeedbacks) {
        let relationship = feedback.relationship;

        if (relationship === RelationshipState.SELF)
          selfPoint = feedback.selfPoint;

        if (relationship === RelationshipState.SENIOR) {
          totalSeniorPoint += feedback.senior_detail.point;
          countSeniorOne += feedback.senior_detail.one === true ? 1 : 0;
          countSeniorTwo += feedback.senior_detail.two === true ? 1 : 0;
          countSeniorThree += feedback.senior_detail.three === true ? 1 : 0;
          countSeniorFour += feedback.senior_detail.four === true ? 1 : 0;
          countSeniorFive += feedback.senior_detail.five === true ? 1 : 0;
          countSeniorKO += feedback.senior_detail.ko === true ? 1 : 0;
          countSeniorTC += feedback.senior_detail.tc === true ? 1 : 0;
        }

        if (relationship === RelationshipState.PEER) {
          totalPeerPoint += feedback.peer_detail.point;
          countPeerOne += feedback.peer_detail.one === true ? 1 : 0;
          countPeerTwo += feedback.peer_detail.two === true ? 1 : 0;
          countPeerThree += feedback.peer_detail.three === true ? 1 : 0;
          countPeerFour += feedback.peer_detail.four === true ? 1 : 0;
          countPeerFive += feedback.peer_detail.five === true ? 1 : 0;
          countPeerKO += feedback.peer_detail.ko === true ? 1 : 0;
          countPeerTC += feedback.peer_detail.tc === true ? 1 : 0;
        }

        if (relationship === RelationshipState.SUBORDINATE) {
          totalSubordinatePoint += feedback.subordinate_detail.point;
          countSubordinateOne +=
            feedback.subordinate_detail.one === true ? 1 : 0;
          countSubordinateTwo +=
            feedback.subordinate_detail.two === true ? 1 : 0;
          countSubordinateThree +=
            feedback.subordinate_detail.three === true ? 1 : 0;
          countSubordinateFour +=
            feedback.subordinate_detail.four === true ? 1 : 0;
          countSubordinateFive +=
            feedback.subordinate_detail.five === true ? 1 : 0;
          countSubordinateKO += feedback.subordinate_detail.ko === true ? 1 : 0;
          countSubordinateTC += feedback.subordinate_detail.tc === true ? 1 : 0;
        }
      }

      let avgSeniorPoint =
        countSeniorTC > 0 ? totalSeniorPoint / countSeniorTC : 0;
      let avgPeerPoint = countPeerTC > 0 ? totalPeerPoint / countPeerTC : 0;
      let avgSubordinatePoint =
        countSubordinateTC > 0 ? totalSubordinatePoint / countSubordinateTC : 0;

      let statisticQuestion = {
        index: indexQuestion,
        id: String(questionObj._id),
        title: questionObj.title,
        type: questionObj.type,
        selfPoint: selfPoint,
        avgSeniorPoint: avgSeniorPoint,
        avgPeerPoint: avgPeerPoint,
        avgSubordinatePoint: avgSubordinatePoint,

        countSenior: {
          one: countSeniorOne > 0 ? countSeniorOne : "",
          two: countSeniorTwo > 0 ? countSeniorTwo : "",
          three: countSeniorThree > 0 ? countSeniorThree : "",
          four: countSeniorFour > 0 ? countSeniorFour : "",
          five: countSeniorFive > 0 ? countSeniorFive : "",
          ko: countSeniorKO > 0 ? countSeniorKO : "",
          tc: countSeniorTC > 0 ? countSeniorTC : "",
        },

        countPeer: {
          one: countPeerOne > 0 ? countPeerOne : "",
          two: countPeerTwo > 0 ? countPeerTwo : "",
          three: countPeerThree > 0 ? countPeerThree : "",
          four: countPeerFour > 0 ? countPeerFour : "",
          five: countPeerFive > 0 ? countPeerFive : "",
          ko: countPeerKO > 0 ? countPeerKO : "",
          tc: countPeerTC > 0 ? countPeerTC : "",
        },

        countSubordinate: {
          one: countSubordinateOne > 0 ? countSubordinateOne : "",
          two: countSubordinateTwo > 0 ? countSubordinateTwo : "",
          three: countSubordinateThree > 0 ? countSubordinateThree : "",
          four: countSubordinateFour > 0 ? countSubordinateFour : "",
          five: countSubordinateFive > 0 ? countSubordinateFive : "",
          ko: countSubordinateKO > 0 ? countSubordinateKO : "",
          tc: countSubordinateTC > 0 ? countSubordinateTC : "",
        },
      };

      statisticReviewQuestions.push(statisticQuestion);
    }

    let rowDatas: any = [];
    for (let record of statisticReviewQuestions) {
      let rowData = [
        record.index,
        record.title,
        record.selfPoint.toFixed(1),
        record.avgSeniorPoint.toFixed(1),
        record.avgPeerPoint.toFixed(1),
        record.avgSubordinatePoint.toFixed(1),

        record.countSenior.one,
        record.countSenior.two,
        record.countSenior.three,
        record.countSenior.four,
        record.countSenior.five,
        record.countSenior.ko,
        record.countSenior.tc,

        record.countPeer.one,
        record.countPeer.two,
        record.countPeer.three,
        record.countPeer.four,
        record.countPeer.five,
        record.countPeer.ko,
        record.countPeer.tc,

        record.countSubordinate.one,
        record.countSubordinate.two,
        record.countSubordinate.three,
        record.countSubordinate.four,
        record.countSubordinate.five,
        record.countSubordinate.ko,
        record.countSubordinate.tc,
      ];

      rowDatas.push(rowData);
    }

    let statisticSelf: any = [];
    let statisticSenior: any = [];
    let statisticPeer: any = [];
    let statisticSubordinate: any = [];
    for (let record of statisticReviewQuestions) {
      statisticSelf.push(record.selfPoint.toFixed(1));
      statisticSenior.push(record.avgSeniorPoint.toFixed(1));
      statisticPeer.push(record.avgPeerPoint.toFixed(1));
      statisticSubordinate.push(record.avgSubordinatePoint.toFixed(1));
    }

    let statisticCriteria = [
      {
        title: "Tự đánh giá",
        data: statisticSelf,
      },
      {
        title: "Cấp trên",
        data: statisticSenior,
      },
      {
        title: "Ngang cấp",
        data: statisticPeer,
      },
      {
        title: "Cấp dưới",
        data: statisticSubordinate,
      },
    ];

    // câu hỏi góp ý
    let statisticAnswerQuestions: any = [];
    let indexAnswerQuestion = 1;
    for (let questionObj of arrAnswerQuestions) {
      indexQuestion = indexQuestion + 1;

      let arrFeedbacks: any = [];
      for (let feedback of userFeedbacks) {
        let filterQuestion = feedback.feedbackData.find(
          (ele) => ele.id === String(questionObj._id)
        );
        arrFeedbacks.push(filterQuestion);
      }

      let stringSeniors: string[] = [];
      let stringPeers: string[] = [];
      let stringSubordinates: string[] = [];

      for (let feedback of arrFeedbacks) {
        let relationship = feedback.relationship;

        if (relationship === RelationshipState.SENIOR) {
          stringSeniors.push("- " + feedback.answer);
        }

        if (relationship === RelationshipState.PEER) {
          stringPeers.push("- " + feedback.answer);
        }

        if (relationship === RelationshipState.SUBORDINATE) {
          stringSubordinates.push("- " + feedback.answer);
        }
      }

      let statisticQuestion = {
        index: indexAnswerQuestion,
        id: String(questionObj._id),
        title: questionObj.title,
        type: questionObj.type,
        stringSeniors: stringSeniors,
        stringPeers: stringPeers,
        stringSubordinates: stringSubordinates,
      };

      statisticAnswerQuestions.push(statisticQuestion);
    }

    // tạo bảng đầu tiên
    const headRows1 = [
      [
        {
          content: "STT",
          colSpan: 1,
          rowSpan: 2,
        },
        {
          content: "Nội dung",
          colSpan: 1,
          rowSpan: 2,
        },
        {
          content: "Điểm Bình Quân",
          colSpan: 4,
          rowSpan: 1,
        },
        {
          content: "Tổng Điểm",
          colSpan: 21,
          rowSpan: 1,
        },
      ],
      [
        {
          content: "Tự đánh giá",
          colSpan: 1,
          rowSpan: 1,
        },
        {
          content: "Cấp trên",
          colSpan: 1,
          rowSpan: 1,
        },
        {
          content: "Ngang cấp",
          colSpan: 1,
          rowSpan: 1,
        },
        {
          content: "Cấp dưới",
          colSpan: 1,
          rowSpan: 1,
        },

        {
          content: "Cấp trên",
          colSpan: 7,
          rowSpan: 1,
        },
        {
          content: "Ngang cấp",
          colSpan: 7,
          rowSpan: 1,
        },
        {
          content: "Cấp dưới",
          colSpan: 7,
          rowSpan: 1,
        },
      ],
      [
        {
          content: "Thang điểm từ 1 đến 5",
          colSpan: 2,
        },

        { content: "" },
        { content: "" },
        { content: "" },
        { content: "" },

        { content: "1" },
        { content: "2" },
        { content: "3" },
        { content: "4" },
        { content: "5" },
        { content: "Ko TC" },
        { content: "TC" },

        { content: "1" },
        { content: "2" },
        { content: "3" },
        { content: "4" },
        { content: "5" },
        { content: "Ko TC" },
        { content: "TC" },

        { content: "1" },
        { content: "2" },
        { content: "3" },
        { content: "4" },
        { content: "5" },
        { content: "Ko TC" },
        { content: "TC" },
      ],
      [
        {
          content: (formInfo.user as User).fullname,
          colSpan: 27,
          styles: {
            halign: "left",
            valign: "middle",
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
          },
        },
      ],
    ];

    // Tạo bảng thứ 2
    const headRows2 = [
      [
        { content: "Tiêu Chí Số" },
        { content: "1" },
        { content: "2" },
        { content: "3" },
        { content: "4" },
        { content: "5" },
        { content: "6" },
        { content: "7" },
        { content: "8" },
        { content: "9" },
      ],
    ];

    let bodyTable2: any = [];
    for (let record of statisticCriteria) {
      bodyTable2.push([record.title, ...record.data]);
    }

    // tạo bảng thứ 3
    const headRows3 = [[{ content: "STT" }, { content: "Nội dung tiêu chí" }]];

    let bodyTable3: any = [];
    for (let record of statisticReviewQuestions) {
      bodyTable3.push([record.index, record.title]);
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Lấy kích thước chiều rộng, chiều cao của trang A4
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - 20 - 15; // chiều rộng tối đa chứa 1 dòng text trên trang a4
    const maxHeight = pageHeight - 20 - 15; // chiều cao tối đa chứa 1 dòng text trên trang a4
    console.log("pageWidth", pageWidth);
    console.log("pageHeight", pageHeight);
    console.log("maxWidth", maxWidth);
    console.log("maxHeight", maxHeight);

    // add the font to jsPDF
    doc.addFileToVFS("Roboto.ttf", FontCustomRobotoNormal);
    doc.addFont("Roboto.ttf", "Roboto", "normal");
    doc.addFileToVFS("Roboto1.ttf", FontCustomRobotoBold);
    doc.addFont("Roboto1.ttf", "Roboto", "bold");

    doc.setFontSize(16);
    doc.setFont("Roboto", "bold");

    const text1 = "BÁO CÁO KẾT QUẢ PHẢN HỒI 360°";
    const textWidth1 = doc.getTextWidth(text1);
    const xCoordinate1 = (pageWidth - textWidth1) / 2; // Tính toạ độ x để căn giữa

    const text2 = `${
      (formInfo.user as User).gender === GenderState.Male ? "Anh" : "Chị"
    } ${(formInfo.user as User).fullname} – ${
      (formInfo.user as User).position
    }`;
    const textWidth2 = doc.getTextWidth(text2);
    const xCoordinate2 = (pageWidth - textWidth2) / 2; // Tính toạ độ x để căn giữa

    doc.text(text1, xCoordinate1, 20);
    doc.text(text2, xCoordinate2, 30);

    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(223, 153, 7);
    doc.text("I. QUY ĐỊNH VỀ BẢO MẬT", 15, 45);
    doc.setTextColor(0, 0, 0);
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
    doc.setTextColor(223, 153, 7);
    doc.text("II. MỤC TIÊU CỦA VIỆC PHẢN HỒI NÀY", 15, 70);
    doc.setTextColor(0, 0, 0);
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
      { maxWidth: 260 }
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
    doc.setTextColor(223, 153, 7);
    doc.text("III. KẾT QUẢ", 15, 135);
    doc.setTextColor(0, 0, 0);
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
    doc.setTextColor(45, 67, 50);
    doc.text("1. Kết quả thống kê", 15, 20);
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto", "normal");

    // Add a table to the PDF using autoTable plugin
    (doc as any).autoTable({
      head: headRows1,
      body: rowDatas,
      startY: 25,
      styles: {
        fontSize: 10,
        font: "Roboto", // Use the custom font for the table
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
      },
      headStyles: {
        fontStyle: "bold", // Make the header bold
        fillColor: [0, 123, 76], // Set header background color
        textColor: [255, 255, 255], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      bodyStyles: {
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      columnStyles: {
        1: { halign: "left" },
        2: { cellWidth: 12 },
        3: { cellWidth: 10 },
        4: { cellWidth: 14 },
        5: { cellWidth: 11 },

        6: { cellWidth: 6 },
        7: { cellWidth: 6 },
        8: { cellWidth: 6 },
        9: { cellWidth: 6 },
        10: { cellWidth: 6 },
        11: { cellWidth: 14 },
        12: { cellWidth: 8 },

        13: { cellWidth: 6 },
        14: { cellWidth: 6 },
        15: { cellWidth: 6 },
        16: { cellWidth: 6 },
        17: { cellWidth: 6 },
        18: { cellWidth: 14 },
        19: { cellWidth: 8 },

        20: { cellWidth: 6 },
        21: { cellWidth: 6 },
        22: { cellWidth: 6 },
        23: { cellWidth: 6 },
        24: { cellWidth: 6 },
        25: { cellWidth: 14 },
        26: { cellWidth: 8 },
      },
      // didParseCell: function (data) {
      //   if (data.cell.text.length > 0) {
      //     data.cell.styles.cellWidth = "auto"; // Cho phép điều chỉnh chiều rộng tự động
      //   }
      // },
    });

    // Lấy vị trí Y của dòng cuối cùng của bảng
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text("Ghi chú:", 15, finalY);
    doc.text("- Ko: Số người không ý kiến ở tiêu chí đánh giá đó;", 35, finalY);
    doc.text("- TC: Tổng cộng số người tham gia phản hồi.", 35, finalY + 5);

    doc.addPage("a4", "l");
    doc.setFontSize(12);

    let answerQuestion2 = statisticAnswerQuestions[0];
    let answerQuestion3 = statisticAnswerQuestions[1];
    let answerQuestion4 = statisticAnswerQuestions[2];
    let oldCurrentY = 0;

    doc.setFont("Roboto", "bold");
    doc.setTextColor(45, 67, 50);
    doc.text("2. Những điểm mạnh nổi bật của NĐPN", 15, 20);
    doc.setTextColor(0, 0, 0);
    doc.text("a/ Nhận xét của cấp trên:", 20, 25);
    doc.setFont("Roboto", "normal");

    let currentY = 30;
    for (let text of answerQuestion2.stringSeniors) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("b/ Nhận xét của đồng nghiệp đồng cấp:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion2.stringPeers) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("c/ Nhận xét của cấp dưới:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion2.stringSubordinates) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 10, maxHeight);
    currentY = currentY != 20 ? currentY + 10 : currentY;
    doc.setTextColor(45, 67, 50);
    doc.text("3. Vấn đề mà NĐPH cần hoàn thiện ngay", 15, currentY);
    doc.setTextColor(0, 0, 0);
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("a/ Nhận xét của cấp trên:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion3.stringSeniors) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("b/ Nhận xét của đồng nghiệp đồng cấp:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion3.stringPeers) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("c/ Nhận xét của cấp dưới:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion3.stringSubordinates) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 10, maxHeight);
    currentY = currentY != 20 ? currentY + 10 : currentY;
    doc.setTextColor(45, 67, 50);
    doc.text("4. Lời khuyên dành cho NĐPH", 15, currentY);
    doc.setTextColor(0, 0, 0);
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("a/ Nhận xét của cấp trên:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion4.stringSeniors) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = oldCurrentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("b/ Nhận xét của đồng nghiệp đồng cấp:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    if (currentY == oldCurrentY) currentY += 5;
    for (let text of answerQuestion4.stringPeers) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("c/ Nhận xét của cấp dưới:", 20, currentY);
    doc.setFont("Roboto", "normal");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion4.stringSubordinates) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    // Add four section
    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(
      doc,
      currentY,
      currentY + 85,
      maxHeight + 25
    );
    currentY = currentY != 20 ? currentY + 10 : currentY;
    doc.setTextColor(223, 153, 7);
    doc.text("IV. PHÂN TÍCH TỔNG QUÁT", 15, currentY);
    doc.setTextColor(0, 0, 0);

    currentY = currentY + 10;
    doc.text((formInfo.user as User).position, 50, currentY);
    doc.setFont("Roboto", "normal");

    // Thêm bảng vào PDF
    (doc as any).autoTable({
      head: headRows2,
      body: bodyTable2,
      startY: currentY + 5,
      styles: {
        fontSize: 10,
        font: "Roboto", // Use the custom font for the table
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
      },
      headStyles: {
        fontStyle: "bold", // Make the header bold
        fillColor: [0, 123, 76], // Màu nền tiêu đề
        textColor: [255, 255, 255], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      bodyStyles: {
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      columnStyles: {
        0: { halign: "left" },
      },
      // Hàm để thay đổi màu nền cho từng hàng
      didParseCell: function (data) {
        if (data.section === "body") {
          // Áp dụng màu nền cho từng hàng theo chỉ số index của row
          // if (data.row.index === 0) {
          //   data.cell.styles.fillColor = [146, 208, 80]; // Hàng đầu tiên - xanh nhạt
          // } else if (data.row.index === 1) {
          //   data.cell.styles.fillColor = [0, 176, 80]; // Hàng thứ hai - xanh lá đậm
          // } else if (data.row.index === 2) {
          //   data.cell.styles.fillColor = [255, 255, 0]; // Hàng thứ ba - vàng
          // } else if (data.row.index === 3) {
          //   data.cell.styles.fillColor = [0, 176, 240]; // Hàng thứ tư - xanh dương
          // }
        }
      },
      tableWidth: 115, // chiều rộng của bảng
    });

    // chèn biểu đồ từ hình ảnh
    // Cấu hình yêu cầu API QuickChart
    let datasetsChart: any = [];
    for (let record of statisticCriteria) {
      if (record.title === "Tự đánh giá") {
        datasetsChart.push({
          label: "Tự đánh giá",
          data: record.data,
          borderColor: "rgb(146, 208, 80)",
          fill: false,
        });
      }
      if (record.title === "Cấp trên") {
        datasetsChart.push({
          label: "Cấp trên",
          data: record.data,
          borderColor: "rgb(0, 176, 80)",
          fill: false,
        });
      }
      if (record.title === "Ngang cấp") {
        datasetsChart.push({
          label: "Ngang cấp",
          data: record.data,
          borderColor: "rgb(255, 255, 0)",
          fill: false,
        });
      }
      if (record.title === "Cấp dưới") {
        datasetsChart.push({
          label: "Cấp dưới",
          data: record.data,
          borderColor: "rgb(0, 176, 240)",
          fill: false,
        });
      }
    }

    const chartConfig = {
      type: "line",
      data: {
        labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
        datasets: datasetsChart,
      },
    };

    const response = await axios.post("https://quickchart.io/chart/create", {
      chart: chartConfig,
      width: 600,
      height: 400,
    });

    // Tải xuống hình ảnh từ URL mà QuickChart trả về
    const imageUrl = response.data.url;

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
      140,
      currentY - 5,
      130,
      80
    );

    currentY = currentY + 80;

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 10, maxHeight);
    currentY = currentY != 20 ? currentY + 10 : currentY;
    doc.setFontSize(12);
    doc.setFont("Roboto", "normal");

    // Thêm bảng vào PDF
    (doc as any).autoTable({
      head: headRows3,
      body: bodyTable3,
      startY: currentY,
      styles: {
        fontSize: 10,
        font: "Roboto", // Use the custom font for the table
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
      },
      headStyles: {
        fillColor: [0, 123, 76], // Màu nền tiêu đề
        textColor: [255, 255, 255], // Set header text color
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      bodyStyles: {
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      columnStyles: {
        0: { halign: "center" },
        1: { halign: "left" },
      },
      // Hàm để thay đổi màu nền cho từng hàng
      didParseCell: function (data) {
        if (data.section === "body") {
          // Áp dụng màu nền cho từng hàng
          // data.cell.styles.fillColor = [216, 216, 216]; // xám nhạt
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY;
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 10, maxHeight);
    currentY = currentY != 20 ? currentY + 10 : currentY;
    oldCurrentY = currentY;
    doc.setFont("Roboto", "bold");
    doc.text("Nhận xét chung cho NĐPH:", 15, currentY);
    doc.setFont("Roboto", "normal");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    if (currentY == oldCurrentY) currentY += 5;

    doc.text(
      "Bạn hiểu & tự đoán biết được khá tương đồng với mọi người xung quanh & nhận ra điểm cần lưu ý về lắng nghe tích cực & truyền cảm hứng cho người khác để càng thành công hơn (tiêu chí số 3 & số 5).",
      15,
      currentY,
      { maxWidth: 265 }
    );

    // Lưu PDF vào buffer
    let filename =
      (formInfo.user as User).fullname.replace(/\s/g, "") +
      moment().format("YYYYMMDDHHmmss") +
      ".pdf";

    const pdfBuffer = doc.output("arraybuffer");

    return { filename: filename, buffer: Buffer.from(pdfBuffer) };
  }

  // hàm kiểm tra tọa độ Y
  public checkCoordinatesY = (
    doc: any,
    currentY: number,
    newCurrentY: number,
    maxHeight: number
  ) => {
    if (newCurrentY > maxHeight) {
      doc.addPage("a4", "l");
      doc.setFontSize(12);
      currentY = 20;
    }

    return currentY;
  };
}

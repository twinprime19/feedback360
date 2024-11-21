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
import axios from "axios";
import { User } from "../user/entities/user.entity";
import { EmailService } from "@app/processors/helper/helper.service.email";
import { sendForm } from "@app/utils/template-email";
import * as APP_CONFIG from "@app/app.config";
import { FormRelationship } from "../form_relationship/form_relationship.model";
import { ChartService } from "../chart/chart.service";

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
    private readonly emailService: EmailService,
    private readonly chartService: ChartService
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
    listEmailAddress: string,
    relationship: number,
    user: AuthPayload
  ) {
    let userInfo = await this.userService.findByUserName(user.userName);

    let formInfo = await this.formModel.findById(formID).populate("user");
    if (!formInfo) throw `Không tìm thấy biểu mẫu.`;

    if (!listEmailAddress || !listEmailAddress.trim().length)
      throw `Vui lòng nhập e-mail cần gửi biểu mẫu.`;
    listEmailAddress = listEmailAddress.replace(/\s+/g, "");

    let fullname = (formInfo.user as User).fullname;
    let feedbackUserID = (formInfo.user as MongooseDoc<User>)._id;

    let time = moment().format("YYYY-MM-DDTHH:mm:ss");
    let templateEmail = formInfo.templateEmail;
    let emails = listEmailAddress.split(";");

    let data = {
      form: formID,
      relationship: relationship,
      user: feedbackUserID,
      receivers: emails,
      time: time,
      templateEmail: templateEmail,
      isSubmitted: false,
      createdBy: userInfo._id,
    };

    let formRelationshipInfo = await this.formRelationshipModel.create(data);

    let logDatas: any =
      formInfo.logDatas && formInfo.logDatas.length ? formInfo.logDatas : [];
    for (let emailAddress of emails) {
      let url = `${APP_CONFIG.APP.FE_URL}/form/${formRelationshipInfo._id}`;
      let to = emailAddress;
      let subject = `${APP_CONFIG.APP.NAME} - Mời tham gia khảo sát phản hồi cho nhân sự`;
      templateEmail = templateEmail
        .replace("[USER_FULLNAME]", fullname)
        .replace("[LINK]", url);
      // let html = sendForm(fullname, url);
      let html = sendForm(templateEmail);

      // send email
      let result: any = await this.emailService.sendMailAsync({
        to,
        subject,
        text: "",
        html,
      });

      let logData = {
        link: url,
        emailAddress: to,
        code: result.code,
        status: result.status,
        accepted: result.accepted,
        rejected: result.rejected,
        messageId: result.messageId,
        response: result.response,
        time: result.time,
      };

      logDatas.push(logData);
    }

    await this.formModel
      .findByIdAndUpdate(formID, { logDatas: logDatas }, { new: true })
      .exec();

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
      let questionObj = await this.questionModel
        .findById(questionID)
        .select(["_id", "title", "content", "type", "status"]);
      newReviewQuestions.push(questionObj);
    }
    (form?.template as any).template.reviewQuestions = newReviewQuestions;

    let answerQuestions = (form?.template as any).template?.answerQuestions;
    let newAnswerQuestions: any = [];
    for (let questionID of answerQuestions) {
      let questionObj = await this.questionModel
        .findById(questionID)
        .select(["_id", "title", "content", "type", "status"]);
      newAnswerQuestions.push(questionObj);
    }
    (form?.template as any).template.answerQuestions = newAnswerQuestions;

    let levelQuestions = (form?.template as any).template?.questions;
    for (let levelObj of levelQuestions) {
      let childQuestions = levelObj.children.length ? levelObj.children : [];
      for (let childObj of childQuestions) {
        let questions = childObj.questions.length ? childObj.questions : [];
        let newAnswerQuestions: any = [];

        for (let questionID of questions) {
          let questionObj = await this.questionModel
            .findById(questionID)
            .select(["_id", "title", "content", "type", "status"]);
          newAnswerQuestions.push(questionObj);
        }
        childObj.questions = newAnswerQuestions;
      }
    }

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
      .lean()
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(`Biểu mẫu có ID "${formID}" không được tìm thấy.`)
      );

    // let reviewQuestions = (form?.template as any).template?.reviewQuestions;
    // let newReviewQuestions: any = [];
    // for (let questionID of reviewQuestions) {
    //   let questionObj = await this.questionModel.findById(questionID).select(["_id", "title", "content", "type", "status"]);
    //   newReviewQuestions.push(questionObj);
    // }
    // (form?.template as any).template.reviewQuestions = newReviewQuestions;

    let answerQuestions = (form?.template as any).template?.answerQuestions;
    let newAnswerQuestions: any = [];
    for (let questionID of answerQuestions) {
      let questionObj = await this.questionModel
        .findById(questionID)
        .select(["_id", "title", "content", "type", "status"]);
      newAnswerQuestions.push(questionObj);
    }
    (form?.template as any).template.answerQuestions = newAnswerQuestions;

    let levelQuestions = (form?.template as any).template?.questions;
    for (let levelObj of levelQuestions) {
      let childQuestions = levelObj.children.length ? levelObj.children : [];
      for (let childObj of childQuestions) {
        let questions = childObj.questions.length ? childObj.questions : [];
        let newAnswerQuestions: any = [];

        for (let questionID of questions) {
          let questionObj = await this.questionModel
            .findById(questionID)
            .select(["_id", "title", "content", "type", "status"]);
          newAnswerQuestions.push(questionObj);
        }
        childObj.questions = newAnswerQuestions;
      }
    }

    let relationship = formRelationshipInfo.relationship;
    let isSubmitted = formRelationshipInfo.isSubmitted;

    let data = {
      ...form,
      relationship: relationship,
      isSubmitted: isSubmitted,
    };

    return data;
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
    const directory = "./assets/uploads/chart";
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

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
      let question = await this.questionModel
        .findById(qid)
        .select(["_id", "title", "content", "type", "status"]);
      if (question) {
        if (question.type === QuestionTypeState.POINT)
          arrReviewQuestions.push(question);
        else arrAnswerQuestions.push(question);
      }
    }

    for (let qid of answerQuestions) {
      let question = await this.questionModel
        .findById(qid)
        .select(["_id", "title", "content", "type", "status"]);
      if (question) {
        if (question.type === QuestionTypeState.POINT)
          arrReviewQuestions.push(question);
        else arrAnswerQuestions.push(question);
      }
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
        //record.countSenior.ko,
        record.countSenior.tc,

        record.countPeer.one,
        record.countPeer.two,
        record.countPeer.three,
        record.countPeer.four,
        record.countPeer.five,
        //record.countPeer.ko,
        record.countPeer.tc,

        record.countSubordinate.one,
        record.countSubordinate.two,
        record.countSubordinate.three,
        record.countSubordinate.four,
        record.countSubordinate.five,
        //record.countSubordinate.ko,
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
        stringSeniors: [...new Set(stringSeniors)],
        stringPeers: [...new Set(stringPeers)],
        stringSubordinates: [...new Set(stringSubordinates)],
      };

      statisticAnswerQuestions.push(statisticQuestion);
    }

    // header của table
    const headRows0 = [
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
          //colSpan: 21,
          colSpan: 18,
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
          //colSpan: 7,
          colSpan: 6,
          rowSpan: 1,
        },
        {
          content: "Ngang cấp",
          //colSpan: 7,
          colSpan: 6,
          rowSpan: 1,
        },
        {
          content: "Cấp dưới",
          //colSpan: 7,
          colSpan: 6,
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
        //{ content: "Ko" },
        { content: "TC" },

        { content: "1" },
        { content: "2" },
        { content: "3" },
        { content: "4" },
        { content: "5" },
        //{ content: "Ko" },
        { content: "TC" },

        { content: "1" },
        { content: "2" },
        { content: "3" },
        { content: "4" },
        { content: "5" },
        //{ content: "Ko" },
        { content: "TC" },
      ],
      [
        {
          content: (formInfo.user as User).fullname,
          colSpan: 24,
          styles: {
            halign: "left",
            valign: "middle",
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
          },
        },
      ],
    ];

    const headRows1 = [
      [
        {
          content: "TỔNG QUAN",
          colSpan: 3,
          rowSpan: 2,
          styles: {
            halign: "left",
            valign: "middle",
          },
        },
        { content: "Điểm số trung bình", colSpan: 2, rowSpan: 1 },
      ],
      [
        {
          content: "Tự đánh giá",
          colSpan: 1,
          rowSpan: 1,
        },
        {
          content: "TB 03 cấp phản hồi",
          colSpan: 1,
          rowSpan: 1,
        },
      ],
    ];

    const headRows2 = [
      [
        {
          content: "TỔNG QUAN",
          colSpan: 3,
          rowSpan: 2,
          styles: {
            halign: "left",
            valign: "middle",
          },
        },
        { content: "Điểm số trung bình", colSpan: 5, rowSpan: 1 },
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
          content: "TB 03 cấp phản hồi",
          colSpan: 1,
          rowSpan: 1,
        },
      ],
    ];

    const headRows3 = [
      [
        {
          content: "KỸ NĂNG LÃNH ĐẠO",
          colSpan: 3,
          rowSpan: 2,
          styles: {
            halign: "left",
            valign: "middle",
          },
        },
        { content: "Điểm số trung bình", colSpan: 5, rowSpan: 1 },
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
          content: "TB 03 cấp phản hồi",
          colSpan: 1,
          rowSpan: 1,
        },
      ],
    ];

    const headRows4 = [
      [
        {
          content: "KỸ NĂNG TẠO ĐỘNG LỰC CHO NHÓM",
          colSpan: 3,
          rowSpan: 2,
          styles: {
            halign: "left",
            valign: "middle",
          },
        },
        { content: "Điểm số trung bình", colSpan: 5, rowSpan: 1 },
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
          content: "TB 03 cấp phản hồi",
          colSpan: 1,
          rowSpan: 1,
        },
      ],
    ];

    const headRows5 = [
      [
        {
          content: "KỸ NĂNG GIẢI QUYẾT XUNG ĐỘT",
          colSpan: 3,
          rowSpan: 2,
          styles: {
            halign: "left",
            valign: "middle",
          },
        },
        { content: "Điểm số trung bình", colSpan: 5, rowSpan: 1 },
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
          content: "TB 03 cấp phản hồi",
          colSpan: 1,
          rowSpan: 1,
        },
      ],
    ];

    let summary_meta = [
      {
        stt: "1",
        title: "Xây dựng mục tiêu và định hướng thực hiện",
        questions: [
          "671b1390cbf5c70d45d2eb22",
          "671b13b2cbf5c70d45d2eb2f",
          "671b13bdcbf5c70d45d2eb34",
          "671b13c9cbf5c70d45d2eb39",
          "671b13d7cbf5c70d45d2eb3e",
          "671b13dfcbf5c70d45d2eb43",
          "671b13e7cbf5c70d45d2eb48",
        ],
      },
      {
        stt: "2",
        title: "Ra quyết định và giải quyết vấn đề",
        questions: [
          "671b13f1cbf5c70d45d2eb4d",
          "671b13fccbf5c70d45d2eb52",
          "671b1408cbf5c70d45d2eb57",
          "671b1414cbf5c70d45d2eb5c",
        ],
      },
      {
        stt: "3",
        title: "Giao tiếp",
        questions: ["671b141ecbf5c70d45d2eb61", "671b142acbf5c70d45d2eb66"],
      },
      {
        stt: "4",
        title: "Động lực và sự gắn kết",
        questions: [
          "671b143ccbf5c70d45d2eb6b",
          "671b1444cbf5c70d45d2eb70",
          "671b144ccbf5c70d45d2eb75",
          "671b145fcbf5c70d45d2eb7f",
          "671b1469cbf5c70d45d2eb84",
          "671b1471cbf5c70d45d2eb89",
          "671b147ccbf5c70d45d2eb8e",
          "671b1485cbf5c70d45d2eb93",
          "671b1490cbf5c70d45d2eb98",
          "671b149acbf5c70d45d2eb9d",
          "671b14a6cbf5c70d45d2eba2",
        ],
      },
      {
        stt: "5",
        title: "Tạo cơ hội phát triển",
        questions: [
          "671b1740cbf5c70d45d2ebb2",
          "671b174acbf5c70d45d2ebb7",
          "671b1752cbf5c70d45d2ebbc",
          "671b1760cbf5c70d45d2ebc1",
          "671b1769cbf5c70d45d2ebc6",
          "671b1773cbf5c70d45d2ebcb",
        ],
      },
      {
        stt: "6",
        title: "Đạo đức và liêm chính",
        questions: [
          "671b177ccbf5c70d45d2ebd0",
          "671b1784cbf5c70d45d2ebd5",
          "671b178bcbf5c70d45d2ebda",
          "671b1795cbf5c70d45d2ebdf",
        ],
      },
      {
        stt: "7",
        title: "Cách tiếp cận vấn đề xung đột",
        questions: [
          "671b17a5cbf5c70d45d2ebe4",
          "671b62acda17663bcc132e83",
          "671b17bdcbf5c70d45d2ebee",
        ],
      },
      {
        stt: "8",
        title: "Công bằng, vô tư",
        questions: [
          "671b17c9cbf5c70d45d2ebf3",
          "671b17dacbf5c70d45d2ebf8",
          "671b17e2cbf5c70d45d2ebfd",
        ],
      },
      {
        stt: "9",
        title: "Giao tiếp trong tình huống xung đột",
        questions: [
          "671b17f9cbf5c70d45d2ec05",
          "671b1802cbf5c70d45d2ec0a",
          "671b180acbf5c70d45d2ec0f",
        ],
      },
      {
        stt: "10",
        title: "Giải quyết vấn đề và hòa giải",
        questions: [
          "671b1812cbf5c70d45d2ec14",
          "671b181acbf5c70d45d2ec19",
          "671b1821cbf5c70d45d2ec1e",
          "671b1829cbf5c70d45d2ec23",
        ],
      },
      {
        stt: "11",
        title: "Tác động lâu dài",
        questions: [
          "671b1831cbf5c70d45d2ec28",
          "671b1838cbf5c70d45d2ec2d",
          "671b184acbf5c70d45d2ec32",
        ],
      },
    ];

    let meta_index_3 = [
      "1.1",
      "1.2",
      "1.3",
      "1.4",
      "1.5",
      "1.6",
      "1.7",

      "2.1",
      "2.2",
      "2.3",
      "2.4",

      "3.1",
      "3.2",
    ];

    let meta_index_4 = [
      "1.1",
      "1.2",
      "1.3",
      "1.4",
      "1.5",
      "1.6",
      "1.7",
      "1.8",
      "1.9",
      "1.10",
      "1.11",

      "2.1",
      "2.2",
      "2.3",
      "2.4",
      "2.5",
      "2.6",

      "3.1",
      "3.2",
      "3.3",
      "3.4",
    ];

    let meta_index_5 = [
      "1.1",
      "1.2",
      "1.3",

      "2.1",
      "2.2",
      "2.3",

      "3.1",
      "3.2",
      "3.3",

      "4.1",
      "4.2",
      "4.3",
      "4.4",

      "5.1",
      "5.2",
      "5.3",
    ];

    let statisticLevel1: any = [];
    let bodyData1: any = [];

    let statisticSelf2: any = [];
    let statisticSenior2: any = [];
    let statisticPeer2: any = [];
    let statisticSubordinate2: any = [];
    let bodyData2: any = [];

    for (let cate of summary_meta) {
      let sumSelfPoint = 0;
      let sumSeniorPoint = 0;
      let sumPeerPoint = 0;
      let sumSubordinatePoint = 0;
      let countSelfPoint = 0;
      let countSeniorPoint = 0;
      let countPeerPoint = 0;
      let countSubordinatPoint = 0;

      for (let record of statisticReviewQuestions) {
        let checkQ = cate.questions.find((item) => item === record.id);
        if (checkQ) {
          if (record.selfPoint != 0) {
            sumSelfPoint = sumSelfPoint + record.selfPoint;
            countSelfPoint = countSelfPoint + 1;
          }
          if (record.avgSeniorPoint != 0) {
            sumSeniorPoint = sumSeniorPoint + record.avgSeniorPoint;
            countSeniorPoint = countSeniorPoint + 1;
          }
          if (record.avgPeerPoint != 0) {
            sumPeerPoint = sumPeerPoint + record.avgPeerPoint;
            countPeerPoint = countPeerPoint + 1;
          }
          if (record.avgSubordinatePoint != 0) {
            sumSubordinatePoint =
              sumSubordinatePoint + record.avgSubordinatePoint;
            countSubordinatPoint = countSubordinatPoint + 1;
          }
        }
      }

      let sumAvgSelfPoint =
        countSelfPoint > 0
          ? Math.round((sumSelfPoint / countSelfPoint) * 10) / 10
          : 0;
      let sumAvgSeniorPoint =
        countSeniorPoint > 0
          ? Math.round((sumSeniorPoint / countSeniorPoint) * 10) / 10
          : 0;
      let sumAvgPeerPoint =
        countPeerPoint > 0
          ? Math.round((sumPeerPoint / countPeerPoint) * 10) / 10
          : 0;
      let sumAvgSubordinatePoint =
        countSubordinatPoint > 0
          ? Math.round((sumSubordinatePoint / countSubordinatPoint) * 10) / 10
          : 0;

      let countSumAvgLevels = 0;
      if (sumAvgSeniorPoint > 0) countSumAvgLevels = countSumAvgLevels + 1;
      if (sumAvgPeerPoint > 0) countSumAvgLevels = countSumAvgLevels + 1;
      if (sumAvgSubordinatePoint > 0) countSumAvgLevels = countSumAvgLevels + 1;

      let sumAvgLevels =
        countSumAvgLevels > 0
          ? Math.round(
              ((sumAvgSeniorPoint + sumAvgPeerPoint + sumAvgSubordinatePoint) /
                countSumAvgLevels) *
                10
            ) / 10
          : 0;

      let data2 = [
        cate.stt,
        cate.title,
        sumAvgSelfPoint.toFixed(1),
        sumAvgSeniorPoint.toFixed(1),
        sumAvgPeerPoint.toFixed(1),
        sumAvgSubordinatePoint.toFixed(1),
        sumAvgLevels.toFixed(1),
      ];
      bodyData2.push(data2);

      statisticSelf2.push(sumAvgSelfPoint.toFixed(1));
      statisticSenior2.push(sumAvgSeniorPoint.toFixed(1));
      statisticPeer2.push(sumAvgPeerPoint.toFixed(1));
      statisticSubordinate2.push(sumAvgSubordinatePoint.toFixed(1));

      let data1 = [
        cate.stt,
        cate.title,
        sumAvgSelfPoint.toFixed(1),
        sumAvgLevels.toFixed(1),
      ];
      bodyData1.push(data1);
      statisticLevel1.push(sumAvgLevels.toFixed(1));
    }

    // 1. Biểu đồ tổng quát
    let statisticCriteria1 = [
      {
        title: "Tự đánh giá",
        data: statisticSelf2,
      },
      {
        title: "TB 03 cấp phản hồi",
        data: statisticLevel1,
      },
    ];

    let titleChart1 = "Biểu đồ tổng quát";

    let labelChart1: any = [];
    for (let record of bodyData1) {
      labelChart1.push(record[1]);
    }

    let dataChart1: any = [];
    for (let record of statisticCriteria1) {
      if (record.title === "Tự đánh giá") {
        dataChart1.push({
          label: "Tự đánh giá",
          data: record.data,
          borderColor: "rgb(146, 208, 80)",
          fill: false,
        });
      }
      if (record.title === "TB 03 cấp phản hồi") {
        dataChart1.push({
          label: "TB 03 cấp phản hồi",
          data: record.data,
          borderColor: "rgb(0, 176, 80)",
          fill: false,
        });
      }
    }

    let bodyTable1: any = [];
    for (var i = 0; i < bodyData1.length; i++) {
      var row: any = [];
      for (var key in bodyData1[i]) {
        row.push(bodyData1[i][key]);
      }
      if (i === 0) {
        row.unshift({
          rowSpan: 3,
          content: "I. Kỹ năng lãnh đạo",
          styles: { valign: "middle", halign: "left" },
        });
      }
      if (i === 3) {
        row.unshift({
          rowSpan: 3,
          content: "II. Kỹ năng tạo động lực cho nhóm",
          styles: { valign: "middle", halign: "left" },
        });
      }
      if (i === 6) {
        row.unshift({
          rowSpan: 5,
          content: "III. Kỹ năng giải quyết xung đột",
          styles: { valign: "middle", halign: "left" },
        });
      }
      bodyTable1.push(row);
    }

    // 2. Biểu đồ Tổng – So sánh theo từng nhóm đối tượng
    let statisticCriteria2 = [
      {
        title: "Tự đánh giá",
        data: statisticSelf2,
      },
      {
        title: "Cấp trên",
        data: statisticSenior2,
      },
      {
        title: "Ngang cấp",
        data: statisticPeer2,
      },
      {
        title: "Cấp dưới",
        data: statisticSubordinate2,
      },
    ];

    let titleChart2 = "Biểu đồ Tổng – So sánh theo từng nhóm đối tượng";

    let labelChart2: any = [];
    for (let record of bodyData2) {
      labelChart2.push(record[1]);
    }

    let dataChart2: any = [];
    for (let record of statisticCriteria2) {
      if (record.title === "Tự đánh giá") {
        dataChart2.push({
          label: "Tự đánh giá",
          data: record.data,
          borderColor: "rgb(146, 208, 80)",
          fill: false,
        });
      }
      if (record.title === "Cấp trên") {
        dataChart2.push({
          label: "Cấp trên",
          data: record.data,
          borderColor: "rgb(0, 176, 80)",
          fill: false,
        });
      }
      if (record.title === "Ngang cấp") {
        dataChart2.push({
          label: "Ngang cấp",
          data: record.data,
          borderColor: "rgb(255, 255, 0)",
          fill: false,
        });
      }
      if (record.title === "Cấp dưới") {
        dataChart2.push({
          label: "Cấp dưới",
          data: record.data,
          borderColor: "rgb(0, 176, 240)",
          fill: false,
        });
      }
    }

    var bodyTable2: any = [];
    for (var i = 0; i < bodyData2.length; i++) {
      var row: any = [];
      for (var key in bodyData2[i]) {
        row.push(bodyData2[i][key]);
      }
      if (i === 0) {
        row.unshift({
          rowSpan: 3,
          content: "I. Kỹ năng lãnh đạo",
          styles: { valign: "middle", halign: "left" },
        });
      }
      if (i === 3) {
        row.unshift({
          rowSpan: 3,
          content: "II. Kỹ năng tạo động lực cho nhóm",
          styles: { valign: "middle", halign: "left" },
        });
      }
      if (i === 6) {
        row.unshift({
          rowSpan: 5,
          content: "III. Kỹ năng giải quyết xung đột",
          styles: { valign: "middle", halign: "left" },
        });
      }
      bodyTable2.push(row);
    }

    // 3. Biểu đồ Kỹ năng Lãnh đạo
    let lanh_dao_quan_ly_ids = [
      "671b1390cbf5c70d45d2eb22",
      "671b13b2cbf5c70d45d2eb2f",
      "671b13bdcbf5c70d45d2eb34",
      "671b13c9cbf5c70d45d2eb39",
      "671b13d7cbf5c70d45d2eb3e",
      "671b13dfcbf5c70d45d2eb43",
      "671b13e7cbf5c70d45d2eb48",
      "671b13f1cbf5c70d45d2eb4d",
      "671b13fccbf5c70d45d2eb52",
      "671b1408cbf5c70d45d2eb57",
      "671b1414cbf5c70d45d2eb5c",
      "671b141ecbf5c70d45d2eb61",
      "671b142acbf5c70d45d2eb66",
    ];

    let statisticSelf3: any = [];
    let statisticSenior3: any = [];
    let statisticPeer3: any = [];
    let statisticSubordinate3: any = [];
    let bodyData3: any = [];
    let index3 = 0;
    for (let record of statisticReviewQuestions) {
      let checkQ = lanh_dao_quan_ly_ids.find((item) => item === record.id);
      if (checkQ) {
        let countAvg3Level = 0;
        if (record.avgSeniorPoint > 0) countAvg3Level += 1;
        if (record.avgPeerPoint > 0) countAvg3Level += 1;
        if (record.avgSubordinatePoint > 0) countAvg3Level += 1;
        let sumAvg3Level =
          countAvg3Level > 0
            ? Math.round(
                ((record.avgSeniorPoint +
                  record.avgPeerPoint +
                  record.avgSubordinatePoint) /
                  countAvg3Level) *
                  10
              ) / 10
            : 0;

        bodyData3.push([
          meta_index_3[index3],
          record.title,
          record.selfPoint,
          record.avgSeniorPoint.toFixed(1),
          record.avgPeerPoint.toFixed(1),
          record.avgSubordinatePoint.toFixed(1),
          sumAvg3Level.toFixed(1),
        ]);

        statisticSelf3.push(record.selfPoint.toFixed(1));
        statisticSenior3.push(record.avgSeniorPoint.toFixed(1));
        statisticPeer3.push(record.avgPeerPoint.toFixed(1));
        statisticSubordinate3.push(record.avgSubordinatePoint.toFixed(1));

        index3 = index3 + 1;
      }
    }

    let statisticCriteria3 = [
      {
        title: "Tự đánh giá",
        data: statisticSelf3,
      },
      {
        title: "Cấp trên",
        data: statisticSenior3,
      },
      {
        title: "Ngang cấp",
        data: statisticPeer3,
      },
      {
        title: "Cấp dưới",
        data: statisticSubordinate3,
      },
    ];

    let titleChart3 = "Biểu đồ Kỹ năng Lãnh đạo";

    let labelChart3: any = [];
    for (let record of bodyData3) {
      labelChart3.push(record[1]);
    }

    let dataChart3: any = [];
    for (let record of statisticCriteria3) {
      if (record.title === "Tự đánh giá") {
        dataChart3.push({
          label: "Tự đánh giá",
          data: record.data,
          borderColor: "rgb(146, 208, 80)",
          fill: false,
        });
      }
      if (record.title === "Cấp trên") {
        dataChart3.push({
          label: "Cấp trên",
          data: record.data,
          borderColor: "rgb(0, 176, 80)",
          fill: false,
        });
      }
      if (record.title === "Ngang cấp") {
        dataChart3.push({
          label: "Ngang cấp",
          data: record.data,
          borderColor: "rgb(255, 255, 0)",
          fill: false,
        });
      }
      if (record.title === "Cấp dưới") {
        dataChart3.push({
          label: "Cấp dưới",
          data: record.data,
          borderColor: "rgb(0, 176, 240)",
          fill: false,
        });
      }
    }

    var bodyTable3: any = [];
    for (var i = 0; i < bodyData3.length; i++) {
      var row: any = [];
      for (var key in bodyData3[i]) {
        row.push(bodyData3[i][key]);
      }
      if (i === 0) {
        row.unshift({
          rowSpan: 7,
          content: "1. Xây dựng mục tiêu và định hướng thực hiện",
          styles: { valign: "middle", halign: "left" },
        });
      }
      if (i === 7) {
        row.unshift({
          rowSpan: 4,
          content: "2. Kỹ năng tạo động lực cho nhóm",
          styles: { valign: "middle", halign: "left" },
        });
      }
      if (i === 11) {
        row.unshift({
          rowSpan: 2,
          content: "3. Giao tiếp",
          styles: { valign: "middle", halign: "left" },
        });
      }
      bodyTable3.push(row);
    }

    // 4. Biểu đồ Kỹ năng Tạo động lực nhóm
    let tao_dong_luc_nhom_question_ids = [
      "671b143ccbf5c70d45d2eb6b",
      "671b1444cbf5c70d45d2eb70",
      "671b144ccbf5c70d45d2eb75",
      "671b145fcbf5c70d45d2eb7f",
      "671b1469cbf5c70d45d2eb84",
      "671b1471cbf5c70d45d2eb89",
      "671b147ccbf5c70d45d2eb8e",
      "671b1485cbf5c70d45d2eb93",
      "671b1490cbf5c70d45d2eb98",
      "671b149acbf5c70d45d2eb9d",
      "671b14a6cbf5c70d45d2eba2",
      "671b1740cbf5c70d45d2ebb2",
      "671b174acbf5c70d45d2ebb7",
      "671b1752cbf5c70d45d2ebbc",
      "671b1760cbf5c70d45d2ebc1",
      "671b1769cbf5c70d45d2ebc6",
      "671b1773cbf5c70d45d2ebcb",
      "671b177ccbf5c70d45d2ebd0",
      "671b1784cbf5c70d45d2ebd5",
      "671b178bcbf5c70d45d2ebda",
      "671b1795cbf5c70d45d2ebdf",
    ];

    let statisticSelf4: any = [];
    let statisticSenior4: any = [];
    let statisticPeer4: any = [];
    let statisticSubordinate4: any = [];
    let bodyData4: any = [];
    let index4 = 0;
    for (let record of statisticReviewQuestions) {
      let checkQ = tao_dong_luc_nhom_question_ids.find(
        (item) => item === record.id
      );
      if (checkQ) {
        let countAvg3Level = 0;
        if (record.avgSeniorPoint > 0) countAvg3Level += 1;
        if (record.avgPeerPoint > 0) countAvg3Level += 1;
        if (record.avgSubordinatePoint > 0) countAvg3Level += 1;
        let sumAvg3Level =
          countAvg3Level > 0
            ? Math.round(
                ((record.avgSeniorPoint +
                  record.avgPeerPoint +
                  record.avgSubordinatePoint) /
                  countAvg3Level) *
                  10
              ) / 10
            : 0;

        bodyData4.push([
          meta_index_4[index4],
          record.title,
          record.selfPoint,
          record.avgSeniorPoint.toFixed(1),
          record.avgPeerPoint.toFixed(1),
          record.avgSubordinatePoint.toFixed(1),
          sumAvg3Level.toFixed(1),
        ]);

        statisticSelf4.push(record.selfPoint.toFixed(1));
        statisticSenior4.push(record.avgSeniorPoint.toFixed(1));
        statisticPeer4.push(record.avgPeerPoint.toFixed(1));
        statisticSubordinate4.push(record.avgSubordinatePoint.toFixed(1));

        index4 = index4 + 1;
      }
    }

    let statisticCriteria4 = [
      {
        title: "Tự đánh giá",
        data: statisticSelf4,
      },
      {
        title: "Cấp trên",
        data: statisticSenior4,
      },
      {
        title: "Ngang cấp",
        data: statisticPeer4,
      },
      {
        title: "Cấp dưới",
        data: statisticSubordinate4,
      },
    ];

    let titleChart4 = "Biểu đồ Kỹ năng Tạo động lực nhóm";

    let labelChart4: any = [];
    for (let record of bodyData4) {
      labelChart4.push(record[1]);
    }

    let dataChart4: any = [];
    for (let record of statisticCriteria4) {
      if (record.title === "Tự đánh giá") {
        dataChart4.push({
          label: "Tự đánh giá",
          data: record.data,
          borderColor: "rgb(146, 208, 80)",
          fill: false,
        });
      }
      if (record.title === "Cấp trên") {
        dataChart4.push({
          label: "Cấp trên",
          data: record.data,
          borderColor: "rgb(0, 176, 80)",
          fill: false,
        });
      }
      if (record.title === "Ngang cấp") {
        dataChart4.push({
          label: "Ngang cấp",
          data: record.data,
          borderColor: "rgb(255, 255, 0)",
          fill: false,
        });
      }
      if (record.title === "Cấp dưới") {
        dataChart4.push({
          label: "Cấp dưới",
          data: record.data,
          borderColor: "rgb(0, 176, 240)",
          fill: false,
        });
      }
    }

    var bodyTable4: any = [];
    for (var i = 0; i < bodyData4.length; i++) {
      var row: any = [];
      for (var key in bodyData4[i]) {
        row.push(bodyData4[i][key]);
      }
      if (i === 0) {
        row.unshift({
          rowSpan: 11,
          content: "1. Động lực và sự gắn kết",
          styles: { valign: "middle", halign: "left" },
        });
      }
      if (i === 11) {
        row.unshift({
          rowSpan: 6,
          content: "2. Tạo cơ hội phát triển",
          styles: { valign: "middle", halign: "left" },
        });
      }
      if (i === 17) {
        row.unshift({
          rowSpan: 4,
          content: "3. Đạo đức và liêm chính",
          styles: { valign: "middle", halign: "left" },
        });
      }
      bodyTable4.push(row);
    }

    // 5. Biểu đồ Kỹ năng Giải quyết xung đột
    let giai_quyet_xung_dot_question_ids = [
      "671b17a5cbf5c70d45d2ebe4",
      "671b62acda17663bcc132e83",
      "671b17bdcbf5c70d45d2ebee",
      "671b17c9cbf5c70d45d2ebf3",
      "671b17dacbf5c70d45d2ebf8",
      "671b17e2cbf5c70d45d2ebfd",
      "671b17f9cbf5c70d45d2ec05",
      "671b1802cbf5c70d45d2ec0a",
      "671b180acbf5c70d45d2ec0f",
      "671b1812cbf5c70d45d2ec14",
      "671b181acbf5c70d45d2ec19",
      "671b1821cbf5c70d45d2ec1e",
      "671b1829cbf5c70d45d2ec23",
      "671b1831cbf5c70d45d2ec28",
      "671b1838cbf5c70d45d2ec2d",
      "671b184acbf5c70d45d2ec32",
    ];

    let statisticSelf5: any = [];
    let statisticSenior5: any = [];
    let statisticPeer5: any = [];
    let statisticSubordinate5: any = [];
    let bodyData5: any = [];
    let index5 = 0;
    for (let record of statisticReviewQuestions) {
      let checkQ = giai_quyet_xung_dot_question_ids.find(
        (item) => item === record.id
      );
      if (checkQ) {
        let countAvg3Level = 0;
        if (record.avgSeniorPoint > 0) countAvg3Level += 1;
        if (record.avgPeerPoint > 0) countAvg3Level += 1;
        if (record.avgSubordinatePoint > 0) countAvg3Level += 1;
        let sumAvg3Level =
          countAvg3Level > 0
            ? Math.round(
                ((record.avgSeniorPoint +
                  record.avgPeerPoint +
                  record.avgSubordinatePoint) /
                  countAvg3Level) *
                  10
              ) / 10
            : 0;

        bodyData5.push([
          meta_index_5[index5],
          record.title,
          record.selfPoint,
          record.avgSeniorPoint.toFixed(1),
          record.avgPeerPoint.toFixed(1),
          record.avgSubordinatePoint.toFixed(1),
          sumAvg3Level.toFixed(1),
        ]);

        statisticSelf5.push(record.selfPoint.toFixed(1));
        statisticSenior5.push(record.avgSeniorPoint.toFixed(1));
        statisticPeer5.push(record.avgPeerPoint.toFixed(1));
        statisticSubordinate5.push(record.avgSubordinatePoint.toFixed(1));

        index5 = index5 + 1;
      }
    }

    let statisticCriteria5 = [
      {
        title: "Tự đánh giá",
        data: statisticSelf5,
      },
      {
        title: "Cấp trên",
        data: statisticSenior5,
      },
      {
        title: "Ngang cấp",
        data: statisticPeer5,
      },
      {
        title: "Cấp dưới",
        data: statisticSubordinate5,
      },
    ];

    let titleChart5 = "Biểu đồ Kỹ năng Giải quyết xung đột";

    let labelChart5: any = [];
    for (let record of bodyData5) {
      labelChart5.push(record[1]);
    }

    let dataChart5: any = [];
    for (let record of statisticCriteria5) {
      if (record.title === "Tự đánh giá") {
        dataChart5.push({
          label: "Tự đánh giá",
          data: record.data,
          borderColor: "rgb(146, 208, 80)",
          fill: false,
        });
      }
      if (record.title === "Cấp trên") {
        dataChart5.push({
          label: "Cấp trên",
          data: record.data,
          borderColor: "rgb(0, 176, 80)",
          fill: false,
        });
      }
      if (record.title === "Ngang cấp") {
        dataChart5.push({
          label: "Ngang cấp",
          data: record.data,
          borderColor: "rgb(255, 255, 0)",
          fill: false,
        });
      }
      if (record.title === "Cấp dưới") {
        dataChart5.push({
          label: "Cấp dưới",
          data: record.data,
          borderColor: "rgb(0, 176, 240)",
          fill: false,
        });
      }
    }

    var bodyTable5: any = [];
    for (var i = 0; i < bodyData5.length; i++) {
      var row: any = [];
      for (var key in bodyData5[i]) {
        row.push(bodyData5[i][key]);
      }
      if (i === 0) {
        row.unshift({
          rowSpan: 3,
          content: "1. Cách tiếp cận vấn đề xung đột",
          styles: { valign: "middle", halign: "left" },
        });
      }
      if (i === 3) {
        row.unshift({
          rowSpan: 3,
          content: "2. Công bằng, vô tư",
          styles: { valign: "middle", halign: "left" },
        });
      }
      if (i === 6) {
        row.unshift({
          rowSpan: 3,
          content: "3. Giao tiếp trong tình huống xung đột",
          styles: { valign: "middle", halign: "left" },
        });
      }
      if (i === 9) {
        row.unshift({
          rowSpan: 4,
          content: "4. Gi ải quyết vấn đề và hòa giải",
          styles: { valign: "middle", halign: "left" },
        });
      }
      if (i === 13) {
        row.unshift({
          rowSpan: 3,
          content: "5. Tác động lâu dài",
          styles: { valign: "middle", halign: "left" },
        });
      }
      bodyTable5.push(row);
    }

    // tạo biểu đồ
    const [imageUrl1, imageUrl2, imageUrl3, imageUrl4, imageUrl5] =
      await Promise.all([
        this.chartService.getMultiLineChart(
          titleChart1,
          labelChart1,
          dataChart1,
          0,
          5
        ),
        this.chartService.getMultiLineChart(
          titleChart2,
          labelChart2,
          dataChart2,
          0,
          5
        ),
        this.chartService.getMultiLineChart(
          titleChart3,
          labelChart3,
          dataChart3,
          0,
          5
        ),
        this.chartService.getMultiLineChart(
          titleChart4,
          labelChart4,
          dataChart4,
          0,
          5
        ),
        this.chartService.getMultiLineChart(
          titleChart5,
          labelChart5,
          dataChart5,
          0,
          5
        ),
      ]);

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

    const text2 = `${(formInfo.user as User).fullname} – ${
      (formInfo.user as User).position
    }`;
    const textWidth2 = doc.getTextWidth(text2);
    const xCoordinate2 = (pageWidth - textWidth2) / 2; // Tính toạ độ x để căn giữa

    doc.text(text1, xCoordinate1, 20);
    doc.text(text2, xCoordinate2, 30);

    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(223, 153, 7);
    doc.text("A. QUY ĐỊNH VỀ BẢO MẬT", 15, 45);
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
    doc.text("B. MỤC TIÊU CỦA VIỆC PHẢN HỒI NÀY", 15, 70);
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
    doc.text("C. NGUYÊN TẮC PHẢN HỒI", 15, 135);
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

    // doc.addPage("a4", "l");
    // doc.setFontSize(12);
    // doc.setFont("Roboto", "bold");
    // doc.setTextColor(45, 67, 50);
    // doc.text("1. Kết quả thống kê", 15, 20);
    // doc.setTextColor(0, 0, 0);
    // doc.setFont("Roboto", "normal");

    // // Add a table to the PDF using autoTable plugin
    // (doc as any).autoTable({
    //   head: headRows0,
    //   body: rowDatas,
    //   startY: 25,
    //   styles: {
    //     fontSize: 10,
    //     font: "Roboto", // Use the custom font for the table
    //     textColor: [0, 0, 0], // Set header text color
    //     lineWidth: 0.1, // Độ dày của viền
    //     lineColor: [0, 0, 0], // Màu sắc viền (đen)
    //     halign: "center", // Center-align table text
    //   },
    //   headStyles: {
    //     fontStyle: "bold", // Make the header bold
    //     fillColor: [0, 123, 76], // Set header background color
    //     textColor: [255, 255, 255], // Set header text color
    //     lineWidth: 0.1, // Độ dày của viền
    //     lineColor: [0, 0, 0], // Màu sắc viền (đen)
    //     halign: "center", // Center-align table text
    //     valign: "middle", // Middle-align table text
    //   },
    //   bodyStyles: {
    //     textColor: [0, 0, 0], // Set header text color
    //     lineWidth: 0.1, // Độ dày của viền
    //     lineColor: [0, 0, 0], // Màu sắc viền (đen)
    //     halign: "center", // Center-align table text
    //     valign: "middle", // Middle-align table text
    //   },
    //   columnStyles: {
    //     1: { halign: "left" },
    //     2: { cellWidth: 12 },
    //     3: { cellWidth: 10 },
    //     4: { cellWidth: 14 },
    //     5: { cellWidth: 11 },

    //     6: { cellWidth: 8 },
    //     7: { cellWidth: 8 },
    //     8: { cellWidth: 8 },
    //     9: { cellWidth: 8 },
    //     10: { cellWidth: 8 },
    //     11: { cellWidth: 8 },
    //     12: { cellWidth: 8 },

    //     13: { cellWidth: 8 },
    //     14: { cellWidth: 8 },
    //     15: { cellWidth: 8 },
    //     16: { cellWidth: 8 },
    //     17: { cellWidth: 8 },
    //     18: { cellWidth: 8 },
    //     19: { cellWidth: 8 },

    //     20: { cellWidth: 8 },
    //     21: { cellWidth: 8 },
    //     22: { cellWidth: 8 },
    //     23: { cellWidth: 8 },
    //     24: { cellWidth: 8 },
    //     25: { cellWidth: 8 },
    //     26: { cellWidth: 8 },
    //   },
    //   // didParseCell: function (data) {
    //   //   if (data.cell.text.length > 0) {
    //   //     data.cell.styles.cellWidth = "auto"; // Cho phép điều chỉnh chiều rộng tự động
    //   //   }
    //   // },
    // });

    // // Lấy vị trí Y của dòng cuối cùng của bảng
    // let finalY = (doc as any).lastAutoTable.finalY + 10;
    // doc.text("Ghi chú:", 15, finalY);
    // //doc.text("- Ko: Số người không ý kiến ở tiêu chí đánh giá đó;", 35, finalY);
    // //doc.text("- TC: Tổng cộng số người tham gia phản hồi.", 35, finalY + 5);
    // doc.text("- TC: Tổng cộng số người tham gia phản hồi.", 35, finalY);

    // Add four section
    doc.setFont("Roboto", "bold");
    doc.setTextColor(223, 153, 7);
    doc.addPage("a4", "l");
    doc.setFontSize(12);
    let currentY = 5;

    doc.text("IV. PHÂN TÍCH TỔNG QUÁT KẾT QUẢ PHẢN HỒI", 15, currentY);
    doc.setTextColor(0, 0, 0);
    currentY = currentY + 5;

    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(45, 67, 50);
    doc.text("1. Biểu đồ tổng quát", 15, currentY);
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto", "normal");
    currentY = currentY + 2;

    const imageResponse1 = await axios.get(imageUrl1, {
      responseType: "arraybuffer",
    });

    //const imagePath1 = path.join(directory, chartName);
    // fs.writeFileSync(imagePath1, imageResponse1.data);
    // const imageData1 = fs.readFileSync(imagePath1).toString("base64");

    // Chuyển dữ liệu ảnh thành base64
    const imageData1 = Buffer.from(imageResponse1.data, "binary").toString(
      "base64"
    );

    // Biểu đồ 1
    doc.addImage({
      imageData: `data:image/jpeg;base64,${imageData1}`,
      format: "JPEG",
      x: 40,
      y: currentY,
      width: 200,
      height: 95,
      compression: "MEDIUM",
    });

    //doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "normal");
    currentY = 110;

    // bảng 1
    (doc as any).autoTable({
      head: headRows1,
      body: bodyTable1,
      startY: currentY,
      margin: { bottom: 5 }, // Điều chỉnh lề cho bảng
      styles: {
        fontSize: 7,
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
        fillColor: [255, 255, 255], // Loại bỏ màu nền cho tất cả các ô
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: "bold" },
        1: { halign: "center" },
        2: { halign: "left" },
      },
      // Hàm để thay đổi màu nền cho từng hàng
      didParseCell: function (data) {
        if (data.section === "body") {
          // Áp dụng màu nền cho từng hàng
          data.cell.styles.fillColor = [255, 255, 255];
        }
      },
    });

    doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    currentY = 5;
    doc.setTextColor(45, 67, 50);
    doc.text(
      "2. Biểu đồ Tổng – So sánh theo từng nhóm đối tượng",
      15,
      currentY
    );
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto", "normal");
    currentY = currentY + 2;

    const imageResponse2 = await axios.get(imageUrl2, {
      responseType: "arraybuffer",
    });

    const imageData2 = Buffer.from(imageResponse2.data, "binary").toString(
      "base64"
    );

    // Biểu đồ 2
    doc.addImage({
      imageData: `data:image/jpeg;base64,${imageData2}`,
      format: "JPEG",
      x: 40,
      y: currentY,
      width: 200,
      height: 95,
      compression: "MEDIUM",
    });

    //doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "normal");
    currentY = 105;

    // bảng 2
    (doc as any).autoTable({
      head: headRows2,
      body: bodyTable2,
      startY: currentY,
      margin: { bottom: 5 }, // Điều chỉnh lề cho bảng
      styles: {
        fontSize: 7,
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
        fillColor: [255, 255, 255], // Loại bỏ màu nền cho tất cả các ô
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: "bold" },
        1: { halign: "center" },
        2: { halign: "left" },
      },
      // Hàm để thay đổi màu nền cho từng hàng
      didParseCell: function (data) {
        if (data.section === "body") {
          // Áp dụng màu nền cho từng hàng
          data.cell.styles.fillColor = [255, 255, 255];
        }
      },
    });

    doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    currentY = 5;
    doc.setTextColor(45, 67, 50);
    doc.text("3. Biểu đồ Kỹ năng Lãnh đạo", 15, currentY);
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto", "normal");
    currentY = currentY + 2;

    const imageResponse3 = await axios.get(imageUrl3, {
      responseType: "arraybuffer",
    });
    const imageData3 = Buffer.from(imageResponse3.data, "binary").toString(
      "base64"
    );

    // biểu đồ 3
    doc.addImage({
      imageData: `data:image/jpeg;base64,${imageData3}`,
      format: "JPEG",
      x: 40,
      y: currentY,
      width: 200,
      height: 95,
      compression: "MEDIUM",
    });

    //doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "normal");
    currentY = 105;

    // bảng 3
    (doc as any).autoTable({
      head: headRows3,
      body: bodyTable3,
      startY: currentY,
      margin: { bottom: 5 }, // Điều chỉnh lề cho bảng
      styles: {
        fontSize: 7,
        font: "Roboto", // Use the custom font for the table
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        cellPadding: 1,
      },
      headStyles: {
        fillColor: [0, 123, 76], // Màu nền tiêu đề
        textColor: [255, 255, 255], // Set header text color
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      bodyStyles: {
        fillColor: [255, 255, 255], // Loại bỏ màu nền cho tất cả các ô
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: "bold" },
        1: { halign: "center" },
        2: { halign: "left" },
      },
      // Hàm để thay đổi màu nền cho từng hàng
      didParseCell: function (data) {
        if (data.section === "body") {
          // Áp dụng màu nền cho từng hàng
          data.cell.styles.fillColor = [255, 255, 255];
        }
      },
    });

    doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    currentY = 5;
    doc.setTextColor(45, 67, 50);
    doc.text("4. Biểu đồ Kỹ năng Tạo động lực nhóm", 15, currentY);
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto", "normal");
    currentY = currentY + 2;

    const imageResponse4 = await axios.get(imageUrl4, {
      responseType: "arraybuffer",
    });
    const imageData4 = Buffer.from(imageResponse4.data, "binary").toString(
      "base64"
    );

    // biểu đồ 4
    doc.addImage({
      imageData: `data:image/jpeg;base64,${imageData4}`,
      format: "JPEG",
      x: 40,
      y: currentY,
      width: 200,
      height: 90,
      compression: "MEDIUM",
    });

    //doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "normal");
    currentY = 100;

    // bảng 4
    (doc as any).autoTable({
      head: headRows4,
      body: bodyTable4,
      startY: currentY,
      margin: { bottom: 5 }, // Điều chỉnh lề cho bảng
      styles: {
        fontSize: 6,
        font: "Roboto", // Use the custom font for the table
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        cellPadding: 1,
      },
      headStyles: {
        fillColor: [0, 123, 76], // Màu nền tiêu đề
        textColor: [255, 255, 255], // Set header text color
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      bodyStyles: {
        fillColor: [255, 255, 255], // Loại bỏ màu nền cho tất cả các ô
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: "bold" },
        1: { halign: "center" },
        2: { halign: "left" },
      },
      // Hàm để thay đổi màu nền cho từng hàng
      didParseCell: function (data) {
        if (data.section === "body") {
          // Áp dụng màu nền cho từng hàng
          data.cell.styles.fillColor = [255, 255, 255];
        }
      },
    });

    doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    currentY = 5;
    doc.setTextColor(45, 67, 50);
    doc.text("5. Biểu đồ Kỹ năng Giải quyết xung đột", 15, currentY);
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto", "normal");
    currentY = currentY + 2;

    const imageResponse5 = await axios.get(imageUrl5, {
      responseType: "arraybuffer",
    });
    const imageData5 = Buffer.from(imageResponse5.data, "binary").toString(
      "base64"
    );

    // biểu đồ 5
    doc.addImage({
      imageData: `data:image/jpeg;base64,${imageData5}`,
      format: "JPEG",
      x: 40,
      y: currentY,
      width: 200,
      height: 95,
      compression: "MEDIUM",
    });

    //doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "normal");
    currentY = 105;

    // bảng 5
    (doc as any).autoTable({
      head: headRows5,
      body: bodyTable5,
      startY: currentY,
      margin: { bottom: 5 }, // Điều chỉnh lề cho bảng
      styles: {
        fontSize: 7,
        font: "Roboto", // Use the custom font for the table
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        cellPadding: 1,
      },
      headStyles: {
        fillColor: [0, 123, 76], // Màu nền tiêu đề
        textColor: [255, 255, 255], // Set header text color
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      bodyStyles: {
        fillColor: [255, 255, 255], // Loại bỏ màu nền cho tất cả các ô
        textColor: [0, 0, 0], // Set header text color
        lineWidth: 0.1, // Độ dày của viền
        lineColor: [0, 0, 0], // Màu sắc viền (đen)
        halign: "center", // Center-align table text
        valign: "middle", // Middle-align table text
      },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: "bold" },
        1: { halign: "center" },
        2: { halign: "left" },
      },
      // Hàm để thay đổi màu nền cho từng hàng
      didParseCell: function (data) {
        if (data.section === "body") {
          // Áp dụng màu nền cho từng hàng
          data.cell.styles.fillColor = [255, 255, 255];
        }
      },
    });

    doc.addPage("a4", "l");
    doc.setFontSize(12);

    let answerQuestion2 = statisticAnswerQuestions[0];
    let answerQuestion3 = statisticAnswerQuestions[1];
    let answerQuestion4 = statisticAnswerQuestions[2];
    let oldCurrentY = 0;

    doc.setFont("Roboto", "bold");
    doc.setTextColor(223, 153, 7);
    doc.text("E. GÓP Ý CHO NĐPH:", 15, 10);
    doc.setTextColor(45, 67, 50);
    doc.text("1. Những điểm mạnh nổi bật của NĐPN", 15, 20);
    doc.setTextColor(0, 0, 0);
    doc.text("a. Nhận xét của cấp trên:", 20, 25);
    doc.setFont("Roboto", "normal");

    currentY = 30;
    for (let text of answerQuestion2.stringSeniors) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 25, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("b. Nhận xét của đồng nghiệp đồng cấp:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion2.stringPeers) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 25, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("c. Nhận xét của cấp dưới:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion2.stringSubordinates) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 25, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 10, maxHeight);
    currentY = currentY != 20 ? currentY + 10 : currentY;
    doc.setTextColor(45, 67, 50);
    doc.text("2. Vấn đề mà NĐPH cần hoàn thiện ngay", 15, currentY);
    doc.setTextColor(0, 0, 0);
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("a. Nhận xét của cấp trên:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion3.stringSeniors) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 25, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("b. Nhận xét của đồng nghiệp đồng cấp:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion3.stringPeers) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 25, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("c. Nhận xét của cấp dưới:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion3.stringSubordinates) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 25, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 10, maxHeight);
    currentY = currentY != 20 ? currentY + 10 : currentY;
    doc.setTextColor(45, 67, 50);
    doc.text("3. Lời khuyên dành cho NĐPH", 15, currentY);
    doc.setTextColor(0, 0, 0);
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("a. Nhận xét của cấp trên:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion4.stringSeniors) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 25, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = oldCurrentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("b. Nhận xét của đồng nghiệp đồng cấp:", 20, currentY);
    doc.setFont("Roboto", "normal");

    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    if (currentY == oldCurrentY) currentY += 5;
    for (let text of answerQuestion4.stringPeers) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 25, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

    doc.setFont("Roboto", "bold");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    doc.text("c. Nhận xét của cấp dưới:", 20, currentY);
    doc.setFont("Roboto", "normal");
    currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    currentY = currentY != 20 ? currentY + 5 : currentY;
    for (let text of answerQuestion4.stringSubordinates) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 25, currentY);

      let lengthRow = splitText.length;
      currentY = currentY + lengthRow * 5;
      currentY = this.checkCoordinatesY(doc, currentY, currentY + 5, maxHeight);
    }
    currentY -= 5;

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

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
import "jspdf-autotable"; // Import the autoTable plugin
import { Feedback } from "../feedback/feedback.model";
import * as path from "path";
import axios from "axios";
import { User } from "../user/entities/user.entity";

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
    private readonly userService: UserService
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
    // let userInfo = await this.userService.findByUserName(user.userName);

    let time = moment().format("YYYY-MM-DDTHH:mm:ss");
    let dataDTO = {
      template: formDTO.template,
      user: formDTO.user,
      time: time,
      // createdBy: userInfo._id,
    };
    return await this.formModel.create(dataDTO);
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
          stringSeniors.push(feedback.answer);
        }

        if (relationship === RelationshipState.PEER) {
          stringPeers.push(feedback.answer);
        }

        if (relationship === RelationshipState.SUBORDINATE) {
          stringSubordinates.push(feedback.answer);
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

    console.log("statisticAnswerQuestions", statisticAnswerQuestions);

    // tạo bảng đầu tiên
    const headRows1 = [
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
          content: (formInfo.user as User).fullname,
          colSpan: 27,
          styles: { halign: "left", valign: "middle" },
        },
      ],
    ];

    const sampleBodyTable1 = [
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

    // Tạo bảng thứ 2
    const headRows2 = [
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
    ];

    const sampleBodyTable2 = [
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

    let bodyTable2: any = [];
    for (let record of statisticCriteria) {
      bodyTable2.push([record.title, ...record.data]);
    }

    // tạo bảng thứ 3
    const headRows3 = [
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
    ];

    const sampleBodyTable3 = [
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

    let bodyTable3: any = [];
    for (let record of statisticReviewQuestions) {
      bodyTable3.push([record.index, record.title]);
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    const maxWidth = 265; // chiều rộng tối đa chứa 1 dòng text trên trang a4

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

    // Add a table to the PDF using autoTable plugin
    (doc as any).autoTable({
      head: headRows1,
      body: rowDatas,
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

    //   doc.setFont("Roboto", "bold");
    //   doc.text("2. Những điểm mạnh nổi bật của NĐPN", 15, 20);
    //   doc.text("a/ Nhận xét của cấp trên:", 20, 25);
    //   doc.setFont("Roboto", "normal");
    //   doc.text("- Thông minh, nhanh,", 20, 30);
    //   doc.text("- Có nhiều kiến thức chuyên môn,", 20, 35);
    //   doc.text("- Có những mối quan hệ trong lĩnh vực phụ trách.", 20, 40);

    //   doc.setFont("Roboto", "bold");
    //   doc.text("b/ Nhận xét của đồng nghiệp đồng cấp:", 20, 45);
    //   doc.setFont("Roboto", "normal");
    //   doc.text(
    //     "- Khả năng phân tích nắm bắt nhanh thị trường, nhiều kinh nghiệm,",
    //     20,
    //     50
    //   );
    //   doc.text("- Xử lý công việc nhanh,", 20, 55);
    //   doc.text(
    //     "- Nhanh nhẹn, tích cực đóng góp ý kiến xây dựng (2 ý kiến),",
    //     20,
    //     60
    //   );
    //   doc.text("- Năng động, tự tin, thông minh,", 20, 65);
    //   doc.text(
    //     "- Nắm rõ hoạt động đầu tư, quy trình, chính sách của cty.",
    //     20,
    //     70
    //   );

    //   doc.setFont("Roboto", "bold");
    //   doc.text("c/ Nhận xét của cấp dưới:", 20, 75);
    //   doc.setFont("Roboto", "normal");
    //   doc.text("- Luôn nỗ lực hoàn thành mục tiêu được giao,", 20, 80);
    //   doc.text("- Tinh thần trách nhiệm cao, ", 20, 85);
    //   doc.text("- Quyết liệt trong công việc,", 20, 90);
    //   doc.text("- Thông minh, giỏi kiến thức,", 20, 95);
    //   doc.text("- Hòa đồng với nhân viên.", 20, 100);

    //   doc.setFont("Roboto", "bold");
    //   doc.text("3. Vấn đề mà NĐPH cần hoàn thiện ngay", 15, 110);
    //   doc.text("a/ Nhận xét của cấp trên:", 20, 115);
    //   doc.setFont("Roboto", "normal");
    //   doc.text("- Tập trung hơn trong cuộc họp (bớt xem điện thoại),", 20, 120);
    //   doc.text("- Cư xử với mọi người điềm đạm hơn,", 20, 125);
    //   doc.text("- Lắng nghe tích cực,", 20, 130);
    //   doc.text("- Giảm cân.", 20, 135);

    //   doc.setFont("Roboto", "bold");
    //   doc.text("b/ Nhận xét của đồng nghiệp đồng cấp:", 20, 140);
    //   doc.setFont("Roboto", "normal");
    //   doc.text(
    //     "- Giảm bớt việc công bố thông tin ngoài lề của các phòng ban khác,",
    //     20,
    //     145
    //   );
    //   doc.text("- Tránh cá nhân hóa các sự việc chung,", 20, 150);
    //   doc.text(
    //     "- Cần bình tĩnh, không nôn nóng thúc giục giải quyết khi vấn đề chưa rõ ràng.",
    //     20,
    //     155
    //   );

    //   doc.setFont("Roboto", "bold");
    //   doc.text("c/ Nhận xét của cấp dưới:", 20, 160);
    //   doc.setFont("Roboto", "normal");
    //   doc.text("- Cần nhẹ nhàng với các phòng ban khác.", 20, 165);

    //   doc.addPage("a4", "l");
    //   doc.setFontSize(12);
    //   doc.setFont("Roboto", "bold");
    //   doc.text("4. Lời khuyên dành cho NĐPH", 15, 20);
    //   doc.text("a/ Nhận xét của cấp trên:", 20, 25);
    //   doc.setFont("Roboto", "normal");
    //   doc.text("- Bình tĩnh để đọc vị cuộc họp,", 20, 30);
    //   doc.text("- Bớt đanh đá,", 20, 35);
    //   doc.text("- Kiểm soát cảm xúc khi giao tiếp.", 20, 40);

    //   doc.setFont("Roboto", "bold");
    //   doc.text("b/ Nhận xét của đồng nghiệp đồng cấp:", 20, 45);
    //   doc.setFont("Roboto", "normal");
    //   doc.text(
    //     "- Khéo léo hơn trong nhận xét ngoài chuyên môn của các phòng ban khác,",
    //     20,
    //     50
    //   );
    //   doc.text(
    //     "- Tăng cường kết nối các bộ phận để dự án đạt hiệu quả cao nhất,",
    //     20,
    //     55
    //   );
    //   doc.text("- Tôn trọng hơn các ý kiến trái chiều.", 20, 60);

    //   doc.setFont("Roboto", "bold");
    //   doc.text("c/ Nhận xét của cấp dưới:", 20, 65);
    //   doc.setFont("Roboto", "normal");
    //   doc.text("- Nhẹ nhàng khuyên, chỉ bảo nhân viên hơn.", 20, 70);

    let answerQuestion2 = statisticAnswerQuestions[0];
    let answerQuestion3 = statisticAnswerQuestions[1];
    let answerQuestion4 = statisticAnswerQuestions[2];

    doc.setFont("Roboto", "bold");
    doc.text("2. Những điểm mạnh nổi bật của NĐPN", 15, 20);
    doc.text("a/ Nhận xét của cấp trên:", 20, 25);
    doc.setFont("Roboto", "normal");
    // doc.text("- Thông minh, nhanh,", 20, 30);
    // doc.text("- Có nhiều kiến thức chuyên môn,", 20, 35);
    // doc.text("- Có những mối quan hệ trong lĩnh vực phụ trách.", 20, 40);
    console.log("answerQuestion2", answerQuestion2);
    let currentY = 30;
    for (let text of answerQuestion2.stringSeniors) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);
      let lengthRow = splitText.length;

      currentY = currentY + lengthRow * 5;
      console.log("currentY", currentY);
    }

    doc.setFont("Roboto", "bold");
    currentY += 5;
    doc.text("b/ Nhận xét của đồng nghiệp đồng cấp:", 20, currentY);
    doc.setFont("Roboto", "normal");
    // doc.text(
    //   "- Khả năng phân tích nắm bắt nhanh thị trường, nhiều kinh nghiệm,",
    //   20,
    //   50
    // );
    // doc.text("- Xử lý công việc nhanh,", 20, 55);
    // doc.text(
    //   "- Nhanh nhẹn, tích cực đóng góp ý kiến xây dựng (2 ý kiến),",
    //   20,
    //   60
    // );
    // doc.text("- Năng động, tự tin, thông minh,", 20, 65);
    // doc.text(
    //   "- Nắm rõ hoạt động đầu tư, quy trình, chính sách của cty.",
    //   20,
    //   70
    // );
    currentY += 5;
    for (let text of answerQuestion2.stringPeers) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);
      let lengthRow = splitText.length;

      currentY = currentY + lengthRow * 5;
      console.log("currentY", currentY);
    }

    doc.setFont("Roboto", "bold");
    currentY += 5;
    doc.text("c/ Nhận xét của cấp dưới:", 20, currentY);
    doc.setFont("Roboto", "normal");
    // doc.text("- Luôn nỗ lực hoàn thành mục tiêu được giao,", 20, 80);
    // doc.text("- Tinh thần trách nhiệm cao, ", 20, 85);
    // doc.text("- Quyết liệt trong công việc,", 20, 90);
    // doc.text("- Thông minh, giỏi kiến thức,", 20, 95);
    // doc.text("- Hòa đồng với nhân viên.", 20, 100);
    currentY += 5;
    for (let text of answerQuestion2.stringSubordinates) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);
      let lengthRow = splitText.length;

      currentY = currentY + lengthRow * 5;
      console.log("currentY", currentY);
    }

    doc.setFont("Roboto", "bold");
    currentY += 10;
    doc.text("3. Vấn đề mà NĐPH cần hoàn thiện ngay", 15, currentY);
    currentY += 5;
    doc.text("a/ Nhận xét của cấp trên:", 20, currentY);
    doc.setFont("Roboto", "normal");
    // doc.text("- Tập trung hơn trong cuộc họp (bớt xem điện thoại),", 20, 120);
    // doc.text("- Cư xử với mọi người điềm đạm hơn,", 20, 125);
    // doc.text("- Lắng nghe tích cực,", 20, 130);
    // doc.text("- Giảm cân.", 20, 135);
    currentY += 5;
    for (let text of answerQuestion3.stringSeniors) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);
      let lengthRow = splitText.length;

      currentY = currentY + lengthRow * 5;
      console.log("currentY", currentY);
    }

    doc.setFont("Roboto", "bold");
    currentY += 5;
    doc.text("b/ Nhận xét của đồng nghiệp đồng cấp:", 20, currentY);
    doc.setFont("Roboto", "normal");
    // doc.text(
    //   "- Giảm bớt việc công bố thông tin ngoài lề của các phòng ban khác,",
    //   20,
    //   145
    // );
    // doc.text("- Tránh cá nhân hóa các sự việc chung,", 20, 150);
    // doc.text(
    //   "- Cần bình tĩnh, không nôn nóng thúc giục giải quyết khi vấn đề chưa rõ ràng.",
    //   20,
    //   155
    // );
    currentY += 5;
    for (let text of answerQuestion3.stringPeers) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);
      let lengthRow = splitText.length;

      currentY = currentY + lengthRow * 5;
      console.log("currentY", currentY);
    }

    doc.setFont("Roboto", "bold");
    currentY += 5;
    doc.text("c/ Nhận xét của cấp dưới:", 20, currentY);
    doc.setFont("Roboto", "normal");
    currentY += 5;
    for (let text of answerQuestion3.stringSubordinates) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);
      let lengthRow = splitText.length;

      currentY = currentY + lengthRow * 5;
      console.log("currentY", currentY);
    }

    doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.text("4. Lời khuyên dành cho NĐPH", 15, 20);
    doc.text("a/ Nhận xét của cấp trên:", 20, 25);
    doc.setFont("Roboto", "normal");
    // doc.text("- Bình tĩnh để đọc vị cuộc họp,", 20, 30);
    // doc.text("- Bớt đanh đá,", 20, 35);
    // doc.text("- Kiểm soát cảm xúc khi giao tiếp.", 20, 40);
    currentY = 25;
    currentY += 5;
    for (let text of answerQuestion4.stringSeniors) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);
      let lengthRow = splitText.length;

      currentY = currentY + lengthRow * 5;
      console.log("currentY", currentY);
    }

    doc.setFont("Roboto", "bold");
    currentY += 5;
    doc.text("b/ Nhận xét của đồng nghiệp đồng cấp:", 20, currentY);
    doc.setFont("Roboto", "normal");
    // doc.text(
    //   "- Khéo léo hơn trong nhận xét ngoài chuyên môn của các phòng ban khác,",
    //   20,
    //   50
    // );
    // doc.text(
    //   "- Tăng cường kết nối các bộ phận để dự án đạt hiệu quả cao nhất,",
    //   20,
    //   55
    // );
    // doc.text("- Tôn trọng hơn các ý kiến trái chiều.", 20, 60);
    currentY += 5;
    for (let text of answerQuestion4.stringPeers) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);
      let lengthRow = splitText.length;

      currentY = currentY + lengthRow * 5;
      console.log("currentY", currentY);
    }

    doc.setFont("Roboto", "bold");
    currentY += 5;
    doc.text("c/ Nhận xét của cấp dưới:", 20, currentY);
    doc.setFont("Roboto", "normal");
    currentY += 5;
    for (let text of answerQuestion4.stringSubordinates) {
      let splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, 20, currentY);
      let lengthRow = splitText.length;

      currentY = currentY + lengthRow * 5;
      console.log("currentY", currentY);
    }

    // Add third section
    doc.setFont("Roboto", "bold");
    currentY = currentY + 10;
    doc.text("III. PHÂN TÍCH TỔNG QUÁT", 15, currentY);

    currentY = currentY + 10;
    doc.text("Giám đốc ......", 50, currentY);
    doc.setFont("Roboto", "normal");

    currentY = currentY + 5;
    // Thêm bảng vào PDF
    (doc as any).autoTable({
      head: headRows2,
      body: bodyTable2,
      startY: currentY,
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
        // datasets: [
        //   {
        //     label: "Tự đánh giá",
        //     data: [4.0, 2.0, 2.0, 3.0, 2.0, 4.0, 4.0, 3.0, 0],
        //     borderColor: "rgb(146, 208, 80)",
        //     fill: false,
        //   },
        //   {
        //     label: "Cấp trên",
        //     data: [4.5, 3.0, 2.5, 2.5, 2.5, 3.5, 4.0, 3.0, 4.0],
        //     borderColor: "rgb(0, 176, 80)",
        //     fill: false,
        //   },
        //   {
        //     label: "Ngang cấp",
        //     data: [4.4, 3.8, 3.3, 3.8, 3.3, 4.0, 3.6, 4.2, 4.0],
        //     borderColor: "rgb(255, 255, 0)",
        //     fill: false,
        //   },
        //   {
        //     label: "Cấp dưới",
        //     data: [5.0, 4.5, 4.0, 4.0, 3.5, 4.0, 4.5, 4.5, 4.0],
        //     borderColor: "rgb(0, 176, 240)",
        //     fill: false,
        //   },
        // ],
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
      currentY - 10,
      150,
      100
    );

    doc.addPage("a4", "l");
    doc.setFontSize(12);
    doc.setFont("Roboto", "normal");

    // Thêm bảng vào PDF
    (doc as any).autoTable({
      head: headRows3,
      body: bodyTable3,
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

    // const text =
    //   "- Bạn hiểu & tự đoán biết được khá tương đồng với mọi người xung quanh & nhận ra điểm cần lưu ý về lắng nghe tích cực & truyền cảm hứng cho người khác để càng thành công hơn (tiêu chí số 3 & số 5). Bạn hiểu & tự đoán biết được khá tương đồng với mọi người xung quanh & nhận ra điểm cần lưu ý về lắng nghe tích cực & truyền cảm hứng cho người khác để càng thành công hơn (tiêu chí số 3 & số 5).";

    // // Sử dụng hàm splitTextToSize để chia văn bản thành nhiều dòng dựa trên chiều rộng tối đa (maxWidth)

    // const splitText = doc.splitTextToSize(text, maxWidth);

    // // Tọa độ bắt đầu của văn bản
    // let currentY1 = 115;
    // console.log("splitText", splitText);

    // // Vẽ đoạn text đã được chia thành nhiều dòng
    // doc.text(splitText, 15, currentY1);

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

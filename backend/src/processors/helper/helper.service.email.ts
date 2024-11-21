/**
 * @file Email service
 * @module processor/helper/email.service
 */

import nodemailer from "nodemailer";
import { Injectable } from "@nestjs/common";
import { getMessageFromNormalError } from "@app/transformers/error.transformer";
import * as APP_CONFIG from "@app/app.config";
import logger from "@app/utils/logger";
import { promisify } from "util";
import moment from "moment";

const log = logger.scope("NodeMailer");

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private clientIsValid: boolean;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: APP_CONFIG.EMAIL.host,
      port: APP_CONFIG.EMAIL.port,
      secure: false,
      auth: {
        user: APP_CONFIG.EMAIL.account,
        pass: APP_CONFIG.EMAIL.password,
      },
    });
    this.verifyClient();
  }

  private verifyClient(): void {
    return this.transporter.verify((error) => {
      if (error) {
        this.clientIsValid = false;
        setTimeout(this.verifyClient.bind(this), 1000 * 60 * 30);
        log.error(
          `client init failed! retry when after 30 mins,`,
          getMessageFromNormalError(error)
        );
      } else {
        this.clientIsValid = true;
        log.info("client init succeed.");
      }
    });
  }

  public sendMail(mailOptions: EmailOptions) {
    if (!this.clientIsValid) {
      log.warn("send failed! (init failed)");
      return false;
    }

    this.transporter.sendMail(
      {
        ...mailOptions,
        from: APP_CONFIG.EMAIL.from,
      },
      (error, info) => {
        if (error) {
          log.error(`send failed!`, getMessageFromNormalError(error));
          console.log("error", error);
        } else {
          log.info("send succeed.", info.messageId, info.response);
          console.log("info", info);
        }
      }
    );
  }

  public async sendMailAsync(mailOptions: EmailOptions): Promise<any> {
    if (!this.clientIsValid) {
      log.warn("send failed! (init failed)");
      return false;
    }

    try {
      const sendMailAsync = promisify(
        this.transporter.sendMail.bind(this.transporter)
      );
      const info = await sendMailAsync({
        ...mailOptions,
        from: APP_CONFIG.EMAIL.from,
      });
      log.info("send succeed.", info.messageId, info.response);
      console.log("info", info);
      let logData = {
        code: "",
        status: 250,
        accepted: info.accepted,
        rejected: info.rejected,
        messageId: info.messageId,
        response: info.response,
        // envelope: info.envelope,
        time: moment().format("DD-MM-YYYY HH:mm:ss"),
      };
      return logData;
    } catch (error) {
      log.error("send failed!", getMessageFromNormalError(error));
      console.log("error", error);
      let logData = {
        code: error.code,
        status: error.responseCode,
        accepted: [],
        rejected: [],
        messageId: "",
        response: error.response,
        // envelope: {},
        time: moment().format("DD-MM-YYYY HH:mm:ss"),
      };
      return logData;
    }
  }

  public sendMailAs(prefix: string, mailOptions: EmailOptions) {
    return this.sendMail({
      ...mailOptions,
      subject: `[${prefix}] ${mailOptions.subject}`,
    });
  }
}

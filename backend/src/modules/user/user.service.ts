import { Injectable } from "@nestjs/common";
import { InjectModel } from "@app/transformers/model.transformer";
import { CreateUserDto } from "./dto/create-user.dto";
import { CreateSuperAdminDto } from "./dto/create-superAdmin.dto";
import { UpdateUserDto, UpdateUserSADto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import * as bcrypt from "bcrypt";
import {
  MongooseModel,
  MongooseDoc,
  MongooseID,
} from "@app/interfaces/mongoose.interface";
import {
  PaginateResult,
  PaginateQuery,
  PaginateOptions,
} from "@app/utils/paginate";
import * as APP_CONFIG from "@app/app.config";
import {
  GenderState,
  UserState,
  UserStatus,
} from "@app/constants/biz.constant";
import { PasswordDTO } from "../auth/auth.dto";
import { importFileExcel } from "@app/utils/upload-file";
import { AuthPayload } from "../auth/auth.interface";
import { Form } from "../form/form.model";
import { Template } from "../template/template.model";
import { EmailService } from "@app/processors/helper/helper.service.email";
import { generatePassword } from "@app/utils/generatePassword";
import { forgotPasswordEmail } from "@app/utils/template-email";
import excelJS from "exceljs";
import moment from "moment";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: MongooseModel<User>,
    @InjectModel(Form) private readonly formModel: MongooseModel<Form>,
    @InjectModel(Template)
    private readonly templateModel: MongooseModel<Template>,
    private readonly emailService: EmailService
  ) {}

  // get list users
  async paginator(
    query: PaginateQuery<User>,
    options: PaginateOptions
  ): Promise<PaginateResult<User>> {
    return await this.userModel.paginate(query, {
      ...options,
      populate: [{ path: "forms" }, { path: "avatar" }],
    });
  }

  // get auth token
  async authToken(userID: string): Promise<MongooseDoc<User> | null> {
    return await this.userModel
      .findOne({
        _id: userID,
        status: UserStatus.ONLINE,
        deletedBy: null,
      })
      .populate(["avatar"])
      .exec()
      .then(
        (result) => result || Promise.reject(`Tài khoản không được tìm thấy.`)
      );
  }

  // change password
  async changePassword(
    userID: string,
    password: PasswordDTO
  ): Promise<MongooseDoc<User> | null> {
    let user = await this.userModel
      .findOne({
        _id: userID,
        status: UserStatus.ONLINE,
        deletedBy: null,
      })
      .exec()
      .then(
        (result) => result || Promise.reject(`Tài khoản không được tìm thấy.`)
      );

    const check = await this.comparePassword(password.password, user.password);
    if (!check) throw `Mật khẩu hiện tại không đúng.`;

    if (password.newPassword) {
      const hashedPassword = await this.hashPassword(password.newPassword);
      password.newPassword = hashedPassword;
    }

    const userObj = await this.userModel
      .findByIdAndUpdate(
        userID,
        { password: password.newPassword },
        { new: true }
      )
      .exec();
    if (!userObj) throw `Người dùng "${userID}" không được tìm thấy.`;
    return userObj;
  }

  // create account superAdmin
  async createSuperAdmin(CreateSuperAdminDto: CreateSuperAdminDto) {
    const existedUserName = await this.userModel
      .findOne({ userName: CreateSuperAdminDto.userName })
      .exec();
    if (existedUserName)
      throw `Tên tài khoản "${CreateSuperAdminDto.userName}" đã tồn tại.`;

    let user = await this.userModel.create(CreateSuperAdminDto);
    return await this.findOne(String(user._id));
  }

  // create user
  async create(createUserDto: CreateUserDto): Promise<MongooseDoc<User>> {
    let userName = createUserDto.userName.trim();
    let emailAddress = createUserDto.emailAddress.trim();
    let fullname = createUserDto.fullname
      ? createUserDto.fullname.trim()
      : userName;
    let position = createUserDto.position ? createUserDto.position.trim() : "";
    let status = createUserDto.status;

    const existedUserName = await this.userModel
      .findOne({ userName: userName })
      .exec();
    if (existedUserName) throw `Tên tài khoản "${userName}" đã tồn tại.`;

    let password = await this.hashPassword("123456");

    let data = {
      userName: userName,
      fullname: fullname,
      password: password,
      emailAddress: emailAddress,
      position: position,
      status: status,
      isSuperAdmin: false,
    };

    let userInfo = await this.userModel.create(data);

    let templates = await this.templateModel
      .find({ deletedAt: null })
      .limit(0)
      .sort({ createdAt: -1 });
    let templateID = templates.length ? templates[0]._id : null;

    let time = moment().format("YYYY-MM-DDTHH:mm:ss");
    let templateEmail = `<p>Xin chào anh/chị,</p>
      <p>Tiến Phước kính mời anh chị tham gia khảo sát phản hồi cho nhân sự: <strong>[USER_FULLNAME]</strong>.</p>
      <p>Anh chị vui lòng nhấp vào liên kết bên dưới để thực hiện khảo sát:</p>
      <p><a href="[LINK]" style="background-color: #2d4432; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Tham gia khảo sát</a></p>
      <p>Trân trọng cảm ơn!</p>
    `;

    let dataDTO = {
      template: templateID,
      user: userInfo._id,
      time: time,
      templateEmail: templateEmail,
      createdBy: userInfo._id,
    };
    await this.formModel.create(dataDTO);

    return await this.findOne(String(userInfo._id));
  }

  // get user by username
  async findOneByUserName(userName: string): Promise<MongooseDoc<User> | null> {
    return await this.userModel
      .findOne({
        userName: userName,
        status: UserStatus.ONLINE,
        isSuperAdmin: true,
        deletedBy: null,
      })
      .collation({ locale: "en", strength: 2 })
      .exec();
  }

  // get user by id
  async findOne(userID: string): Promise<MongooseDoc<User>> {
    return await this.userModel
      .findOne({ _id: userID, deletedBy: null })
      .populate(["avatar"])
      .exec()
      .then(
        (result) =>
          result || Promise.reject(`Người dùng"${userID}" không được tìm thấy`)
      );
  }

  // get user by username
  async findByUserName(userName: string): Promise<MongooseDoc<User>> {
    return await this.userModel
      .findOne({
        userName: userName,
        status: UserStatus.ONLINE,
        deletedBy: null,
      })
      .then(
        (result) =>
          result ||
          Promise.reject(
            `Tên tài khoản "${userName}" không được tìm thấy hoặc không hoạt động!`
          )
      );
  }

  // update user
  async update(
    userID: string,
    updateUserDto: UpdateUserDto
  ): Promise<MongooseDoc<User>> {
    let userName = updateUserDto.userName.trim();
    let emailAddress = updateUserDto.emailAddress.trim();
    let fullname = updateUserDto.fullname
      ? updateUserDto.fullname.trim()
      : userName;
    let position = updateUserDto.position ? updateUserDto.position.trim() : "";
    let status = updateUserDto.status;

    const existedUserName = await this.userModel
      .findOne({ userName: userName, _id: { $ne: userID } })
      .exec();
    if (existedUserName) throw `Tên tài khoản "${userName}" đã tồn tại.`;

    let data = {
      userName: userName,
      fullname: fullname,
      emailAddress: emailAddress,
      position: position,
      status: status,
      isSuperAdmin: false,
    };

    const user = await this.userModel
      .findByIdAndUpdate(userID, data, { new: true })
      .exec();
    if (!user) throw `Người dùng"${userID}" không được tìm thấy`;
    return await this.findOne(String(user._id));
  }

  // update status user
  async updateStatus(
    userID: string,
    status: number
  ): Promise<MongooseDoc<User>> {
    const user = await this.userModel
      .findByIdAndUpdate(userID, { status: status }, { new: true })
      .exec();
    if (!user) throw `Người dùng"${userID}" không được tìm thấy`;
    return await this.findOne(String(user._id));
  }

  // delete user
  async remove(
    userID: MongooseID,
    user: AuthPayload
  ): Promise<MongooseDoc<User>> {
    let userInfo = await this.findByUserName(user.userName);

    const userObj = await this.userModel.findByIdAndRemove(userID).exec();
    if (!userObj) throw `Người dùng"${userID}" không được tìm thấy.`;
    return userObj;
  }

  // delete users
  public async batchDelete(userIDs: MongooseID[], user: AuthPayload) {
    let userInfo = await this.findByUserName(user.userName);

    const users = await this.userModel.find({ _id: { $in: userIDs } }).exec();
    if (!users) throw `Người dùng không được tìm thấy.`;
    return await this.userModel.deleteMany({ _id: { $in: userIDs } }).exec();
  }

  // hash password
  async hashPassword(password: string): Promise<string> {
    const saltOrRounds = 10;
    const hashedPassword: string = await bcrypt.hash(password, saltOrRounds);
    return hashedPassword;
  }

  //function compare password param with user password in database
  async comparePassword(
    password: string,
    storePasswordHash: string
  ): Promise<any> {
    return await bcrypt.compare(password, storePasswordHash);
  }

  // export list users by excel
  async exportUsers(
    query: PaginateQuery<User>,
    options: PaginateOptions
  ): Promise<any> {
    let users = await this.userModel.find(query).sort(options.sort);

    const data = users.map((item) => ({
      FullName: item.fullname,
      UserName: item.userName,
      Email: item.emailAddress,
      Position: item.position,
    }));

    const listUsers = JSON.parse(JSON.stringify(data));
    const workbook = new excelJS.Workbook(); // Create a new workbook
    const worksheet = workbook.addWorksheet("Danh sách nhân viên"); // New Worksheet

    // Column for data in excel. key must match data key
    worksheet.columns = [
      { header: "Họ tên", key: "FullName", width: 35 },
      { header: "Tên tài khoản", key: "UserName", width: 35 },
      { header: "E-mail", key: "Email", width: 35 },
      { header: "Chức vụ", key: "Position", width: 35 },
    ];

    listUsers.forEach((user) => {
      worksheet.addRow(user); // Add data in worksheet
    });

    // Making first line in excel bold
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    return await workbook.xlsx.writeBuffer();
  }

  // import list users
  public async importUsers(file: any, user: AuthPayload): Promise<any> {
    let userInfo = await this.findByUserName(user.userName);
    let listUsers: any = await importFileExcel(file);

    let index = 0;
    let password = await this.hashPassword("123456");

    let templates = await this.templateModel
      .find({ deletedAt: null })
      .limit(0)
      .sort({ createdAt: -1 });
    let templateID = templates.length ? templates[0]._id : null;

    let time = moment().format("YYYY-MM-DDTHH:mm:ss");
    let templateEmail = `<p>Xin chào anh/chị,</p>
      <p>Tiến Phước kính mời anh chị tham gia khảo sát phản hồi cho nhân sự: <strong>[USER_FULLNAME]</strong>.</p>
      <p>Anh chị vui lòng nhấp vào liên kết bên dưới để thực hiện khảo sát:</p>
      <p><a href="[LINK]" style="background-color: #2d4432; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Tham gia khảo sát</a></p>
      <p>Trân trọng cảm ơn!</p>
    `;

    for (let user of listUsers) {
      let userName = user["Tên tài khoản"]
        ? user["Tên tài khoản"].trim()
        : null;
      let fullname = user["Họ tên"] ? user["Họ tên"] : null;
      if (!userName)
        throw `Tên tài khoản tại dòng thứ 2 "${index + 2}" là trường bắt buộc.`;
      if (!fullname)
        throw `Họ tên tại dòng thứ 2 "${index + 2}" là trường bắt buộc.`;

      // let gender = GenderState.Male;
      // if (
      //   user["Giới tính"] &&
      //   user["Giới tính"].trim() &&
      //   user["Giới tính"].trim().toLowerCase() == "nam"
      // )
      //   gender = GenderState.Male;
      // else gender = GenderState.Female;

      let data = {
        fullname: fullname,
        userName: userName,
        password: password,
        emailAddress: user["E-mail"] ? user["E-mail"] : "",
        position: user["Chức vụ"] ? user["Chức vụ"] : "",
        status: 1,
        isSuperAdmin: false,
        createdBy: userInfo._id,
      };

      const checkUserName = await this.userModel
        .findOne({ userName: data.userName })
        .exec();

      if (checkUserName) {
        await this.userModel
          .findByIdAndUpdate(checkUserName._id, data, { new: true })
          .exec();

        let dataDTO = {
          template: templateID,
          user: checkUserName._id,
          time: time,
          templateEmail: templateEmail,
          createdBy: userInfo._id,
          deletedAt: null,
          deletedBy: null,
        };
        await this.formModel.create(dataDTO);
      } else {
        let userObj = await this.userModel.create(data);

        let dataDTO = {
          template: templateID,
          user: userObj._id,
          time: time,
          templateEmail: templateEmail,
          createdBy: userInfo._id,
        };
        await this.formModel.create(dataDTO);
      }

      index++;
    }

    return listUsers;
  }

  async updateProfile(
    userID: string,
    userDTO: UpdateUserSADto
  ): Promise<MongooseDoc<User>> {
    let userName = userDTO.userName.trim();
    let emailAddress = userDTO.emailAddress.trim();
    let fullname = userDTO.fullname.trim();
    let position = userDTO.position ? userDTO.position : "";

    const checkExistUsername = await this.userModel
      .findOne({ userName: userName, _id: { $ne: userID } })
      .exec();
    if (checkExistUsername) throw `Tên tài khoản "${userName}" đã tồn tại.`;

    const checkExistEmail = await this.userModel
      .findOne({
        emailAddress: emailAddress,
        _id: { $ne: userID },
      })
      .exec();
    if (checkExistEmail) throw `E-mail "${emailAddress}" đã tồn tại.`;

    let data = {
      userName: userName,
      fullname: fullname,
      emailAddress: emailAddress,
      position: position,
    };

    const user = await this.userModel
      .findByIdAndUpdate(userID, data, { new: true })
      .exec();
    if (!user) throw `Cập nhật thông tin tài khoản bị lỗi.`;

    return await this.findOne(String(user._id));
  }

  // forgot password user
  async forgotPassword(emailAddress: string): Promise<User> {
    let user = await this.userModel
      .findOne({
        emailAddress: emailAddress,
        status: UserState.ACTIVE,
        deletedBy: null,
      })
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(`E-mail "${emailAddress}" không được tìm thấy.`)
      );

    let newPassword = generatePassword(6);
    let hashPassword = await this.hashPassword(newPassword);

    await this.userModel
      .findByIdAndUpdate(user._id, { password: hashPassword }, { new: true })
      .exec();

    let url = `${APP_CONFIG.APP.FE_URL}/login`;
    let to = user.emailAddress;
    let subject = `${APP_CONFIG.APP.NAME} - Quên mật khẩu`;
    let html = forgotPasswordEmail(user.fullname, newPassword, url);
    // send email
    this.emailService.sendMail({ to, subject, text: "", html });

    return user;
  }
}

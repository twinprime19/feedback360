import { Injectable } from "@nestjs/common";
import { InjectModel } from "@app/transformers/model.transformer";
import { CreateUserDto } from "./dto/create-user.dto";
import { CreateSuperAdminDto } from "./dto/create-superAdmin.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
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
import { UserStatus } from "@app/constants/biz.constant";
import { PasswordDTO } from "../auth/auth.dto";
import { importFileExcel } from "@app/utils/upload-file";
import { AuthPayload } from "../auth/auth.interface";
import { Form } from "../form/form.model";
import excelJS from "exceljs";
import moment from "moment";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: MongooseModel<User>,
    @InjectModel(Form) private readonly formModel: MongooseModel<Form>
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
  async authToken(userName: any): Promise<MongooseDoc<User> | null> {
    return await this.userModel
      .findOne({
        userName: userName,
        status: UserStatus.ONLINE,
        deletedBy: null,
      })
      .populate(["roles", "avatar"])
      .select("-password")
      .exec()
      .then(
        (result) =>
          result || Promise.reject(`Username "${userName}" isn't found!`)
      );
  }

  // change password
  async changePassword(
    userName: any,
    password: PasswordDTO
  ): Promise<MongooseDoc<User> | null> {
    let user = await this.userModel
      .findOne({
        userName: userName,
        status: UserStatus.ONLINE,
        deletedBy: null,
      })
      .exec()
      .then(
        (result) =>
          result || Promise.reject(`Username "${userName}" isn't found!`)
      );

    const check = await this.comparePassword(password.password, user.password);
    if (!check) throw `The current password is not right!`;

    if (password.newPassword) {
      const hashedPassword = await this.hashPassword(password.newPassword);
      password.newPassword = hashedPassword;
    }

    const userObj = await this.userModel
      .findByIdAndUpdate(
        user._id,
        { password: password.newPassword },
        { new: true }
      )
      .select("-password")
      .exec();
    if (!userObj) throw `User id "${user._id}" isn't found!`;
    return userObj;
  }

  // create account superAdmin
  async createSuperAdmin(CreateSuperAdminDto: CreateSuperAdminDto) {
    const existedUserName = await this.userModel
      .findOne({ userName: CreateSuperAdminDto.userName })
      .exec();
    if (existedUserName)
      throw `Username "${CreateSuperAdminDto.userName}" is existed!`;

    let user = await this.userModel.create(CreateSuperAdminDto);
    return await this.findOne(String(user._id));
  }

  // create user
  async create(createUserDto: CreateUserDto): Promise<MongooseDoc<User>> {
    const existedUserName = await this.userModel
      .findOne({ userName: createUserDto.userName })
      .exec();
    if (existedUserName)
      throw `Username "${createUserDto.userName}" is existed!`;

    createUserDto.fullname = createUserDto.fullname
      ? createUserDto.fullname
      : createUserDto.userName;

    let user = await this.userModel.create(createUserDto);
    return await this.findOne(String(user._id));
  }

  // get user by username
  async findOneByUserName(userName: string): Promise<MongooseDoc<User> | null> {
    return await this.userModel
      .findOne({
        userName: userName,
        status: UserStatus.ONLINE,
        deletedBy: null,
      })
      .collation({ locale: "en", strength: 2 })
      .populate("roles")
      .exec();
  }

  // get user by id
  async findOne(userID: string): Promise<MongooseDoc<User>> {
    return await this.userModel
      .findOne({ _id: userID, deletedBy: null })
      .populate(["createdBy", "roles", "avatar"])
      .select("-password")
      .exec()
      .then(
        (result) => result || Promise.reject(`User id "${userID}" isn't found`)
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
          Promise.reject(`Username "${userName}" isn't found or is inactive!`)
      );
  }

  // update user
  async update(
    userID: string,
    updateUserDto: UpdateUserDto
  ): Promise<MongooseDoc<User>> {
    const user = await this.userModel
      .findByIdAndUpdate(userID, updateUserDto, { new: true })
      .exec();
    if (!user) throw `User id "${userID}" isn't found`;
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
    if (!user) throw `User id "${userID}" isn't found`;
    return await this.findOne(String(user._id));
  }

  // delete user
  async remove(
    userID: MongooseID,
    user: AuthPayload
  ): Promise<MongooseDoc<User>> {
    let userInfo = await this.findByUserName(user.userName);

    const userObj = await this.userModel
      .findByIdAndUpdate(
        userID,
        {
          deletedBy: userInfo._id,
          deletedAt: moment(),
        },
        { new: true }
      )
      .select("-password")
      .exec();
    if (!userObj) throw `User id "${userID}" isn't found!`;
    return userObj;
  }

  // delete users
  public async batchDelete(userIDs: MongooseID[], user: AuthPayload) {
    let userInfo = await this.findByUserName(user.userName);

    const users = await this.userModel.find({ _id: { $in: userIDs } }).exec();
    if (!users) throw `Users aren't found!`;

    return await this.userModel
      .updateMany(
        { _id: { $in: userIDs } },
        { deletedBy: userInfo._id, deletedAt: moment() },
        { new: true }
      )
      .exec();
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
      Password: item.password,
      Email: item.emailAddress,
      Phone: item.phone,
      Status: item.status,
    }));

    const listUsers = JSON.parse(JSON.stringify(data));
    const workbook = new excelJS.Workbook(); // Create a new workbook
    const worksheet = workbook.addWorksheet("List users"); // New Worksheet

    // Column for data in excel. key must match data key
    worksheet.columns = [
      { header: "Họ tên", key: "Họ tên", width: 35 },
      { header: "Tên tài khoản", key: "Tên tài khoản", width: 35 },
      { header: "E-mail", key: "E-mail", width: 35 },
      { header: "Chức vụ", key: "Chức vụ", width: 35 },
      { header: "Số điện thoại", key: "Số điện thoại", width: 35 },
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

    let datas: object[] = [];
    let index = 0;
    let password = await this.hashPassword("123456");
    for (let user of listUsers) {
      if (!user["Tên tài khoản"])
        throw `Tên tài khoản tại dòng thứ 2 "${index + 2}" là trường bắt buộc!`;
      if (!user["Họ tên"])
        throw `Họ tên tại dòng thứ 2 "${index + 2}" là trường bắt buộc!`;
      // if (!user.["Tên tài khoản"])
      //   throw `Password at row index"${index + 2}" is required!`;

      const checkUserName = await this.userModel
        .findOne({ userName: user.UserName })
        .exec();
      if (checkUserName) throw `Tên tài khoản "${user.UserName}" đã tồn tại!`;

      let data = {
        fullname: user["Họ tên"],
        userName: user["Tên tài khoản"],
        password: password,
        emailAddress: user["E-mail"] ? user["E-mail"] : "",
        position: user["Chức vụ"] ? user["Chức vụ"] : "",
        phone: user["Số điện thoại"] ? user["Số điện thoại"] : "",
        address: user["Địa chỉ"] ? user["Địa chỉ"] : "",
        status: 1,
        isSuperAdmin: false,
        createdBy: userInfo._id,
      };

      datas.push(data);
      index++;
    }

    for (let data of datas) {
      let userObj = await this.userModel.create(data);

      let time = moment().format("YYYY-MM-DDTHH:mm:ss");
      let templateEmail = `<p>Xin chào anh/chị,</p>
                              <p>Tiến Phước kính mời anh chị tham gia khảo sát phản hồi cho nhân sự: <strong>[USER_FULLNAME]</strong>.</p>
                              <p>Anh chị vui lòng nhấp vào liên kết bên dưới để thực hiện khảo sát:</p>
                              <p><a href="[LINK]" style="background-color: #2d4432; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Tham gia khảo sát</a></p>
                              <p>Trân trọng cảm ơn!</p>`;
      let dataDTO = {
        template: "66f0e0fcae2716747b0cc972",
        user: userObj._id,
        time: time,
        templateEmail: templateEmail,
        createdBy: userInfo._id,
      };

      await this.formModel.create(dataDTO);
    }

    return datas;
  }
}

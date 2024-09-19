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
import excelJS from "exceljs";
import moment from "moment";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: MongooseModel<User>
  ) {}

  // get list users
  async paginator(
    query: PaginateQuery<User>,
    options: PaginateOptions
  ): Promise<PaginateResult<User>> {
    return await this.userModel.paginate(query, {
      ...options,
      populate: [{ path: "roles" }],
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
      { header: "FullName", key: "FullName", width: 25 },
      { header: "UserName", key: "UserName", width: 25 },
      { header: "Password", key: "Password", width: 25 },
      { header: "Email", key: "Email", width: 25 },
      { header: "Phone", key: "Phone", width: 25 },
      { header: "Status", key: "Status", width: 25 },
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
  public async importUsers(file: any, user: AuthPayload): Promise<User[]> {
    let userInfo = await this.findByUserName(user.userName);
    let listUsers: any = await importFileExcel(file);

    let datas: object[] = [];
    let index = 0;
    for (let user of listUsers) {
      if (!user.UserName)
        throw `Username at row index "${index + 2}" is required!`;
      if (!user.Password)
        throw `Password at row index"${index + 2}" is required!`;

      const checkUserName = await this.userModel
        .findOne({ userName: user.UserName })
        .exec();
      if (checkUserName) throw `Username "${user.UserName}" is existed!`;

      user.Password = await this.hashPassword(user.Password);
      let data = {
        fullname: user.FullName ? user.FullName : user.UserName,
        userName: user.UserName,
        password: user.Password,
        emailAddress: user.Email ? user.Email : null,
        phone: user.Phone ? user.Phone : null,
        status: user.Status ? user.Status : 0,
        createdBy: userInfo._id,
      };

      datas.push(data);
      index++;
    }

    return await this.userModel.create(datas);
  }
}

import * as APP_CONFIG from "@app/app.config";
import moment from "moment";

// Template kích hoạt tài khoản
export const activationAccountEmail = (fullname: string, url: string) => {
  let templateHTML = `
  <div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tbody>
                <tr align="center">
                  <td>
                    <a href="${APP_CONFIG.APP.FE_URL}" target="_blank">
                      <img src="https://feedback.test.zinisoft.net/images/logo.png" width="252px" height="96px" alt="WKEY"> 
                    </a>
                  </td>
                </tr>
                <tr>
                  <td width="100%" cellpadding="0" cellspacing="0">
                    <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; font-family: Nunito Sans, sans-serif; color: #222222;">
                      <tbody>
                        <tr>
                          <td>
                            <p>Xin chào, <strong>${fullname}</strong>,</p>
                            <p>Cảm ơn bạn đã đăng ký WKEY, ứng dụng công nghệ 4.0 trong lĩnh vực BẠC ÁNH SÁNG gắn liền với lan tỏa triết lý giáo dục tận gốc vào cuộc sống của mỗi cá nhân, gia đình, tổ chức và xã hội.</p>
                            <p>Nhấp vào liên kết dưới đây để kích hoạt tài khoản của bạn và bắt đầu trải nghiệm cùng chúng tôi:<br> </p>

                            <div class="button-active" style="padding-bottom: 16px;">
                              <button class="active" style="padding: 12px 60px; background-color: #125742; border: none; border-radius: 6px;">
                                <a style="color: #dfd9c4; text-decoration: none" href="${url}" target="_blank">Kích hoạt tài khoản</a>
                              </button>
                            </div>

                            
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
    
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </div>`;

  return templateHTML;
};

// Template kích hoạt tài khoản
export const activationAccountAuthorityEmail = (
  fullname: string,
  phone: string,
  emailAddress: string,
  password: string
) => {
  let templateHTML = `
  <div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tbody>
                <tr align="center">
                  <td>
                    <a href="${APP_CONFIG.APP.FE_URL}" target="_blank">
                      <img src="https://feedback.test.zinisoft.net/images/logo.png" width="252px" height="96px" alt="WKEY"> 
                    </a>
                  </td>
                </tr>
                <tr>
                  <td width="100%" cellpadding="0" cellspacing="0">
                    <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; font-family: Nunito Sans, sans-serif; color: #222222;">
                      <tbody>
                        <tr>
                          <td>
                            <p>Xin chào, <strong>${fullname}</strong>,</p>
                            <p>Bạn đã nhận được một lời ủy quyền trao đổi, mua bán bạc tại WKEY từ khách hàng ${fullname} - ${phone}.</p>
                            <p>WKEY là ứng dụng công nghệ 4.0 trong lĩnh vực BẠC ÁNH SÁNG gắn liền với triết lý giáo dục tận gốc vào cuộc sống của mỗi cá nhân, gia đình, tổ chức và xã hội.</p>
                            <br>
                            <p>Thông tin tài khoản của bạn:</p>
                            <p>E-mail: <strong>${emailAddress}</strong></p>
                            <p>Mật khẩu: <strong>${password}</strong></p>
                            <br>
                            <p>Lưu ý: Quý khách vui lòng thay đổi mật khẩu cá nhân ngay sau khi đăng nhập.</p>
                            
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
    
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </div>`;

  return templateHTML;
};

// Template chào mừng user
export const welcomeAccountEmail = (fullname: string, email: string) => {
  let templateHTML = `
  <div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td align="center"> 
            <table width="100%" cellpadding="0" cellspacing="0">
              <tbody>
                <tr align="center">
                  <td>
                    <a href="${APP_CONFIG.APP.FE_URL}" target="_blank">
                      <img src="https://feedback.test.zinisoft.net/images/logo.png" width="252px" height="96px" alt="WKEY"> 
                    </a>
                  </td>
                </tr>
              
                <tr>
                  <td width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; font-family: Nunito Sans, sans-serif; color: #222222;">
                    <table align="center" width="600" cellpadding="0" cellspacing="0">
                      <tbody>
                        <tr>
                          <td>
                            <p>Xin chào, <strong>${fullname}</strong>,</p>
                            <p>Tài khoản của quý khách đã kích hoạt thành công. Để đảm bảo bảo mật trong suốt quá trình sử dụng, vui lòng không chia sẻ thông tin tài khoản của bạn với bất kỳ ai (kể cả nhân viên của WKEY).</p>

                            
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </div>`;
  return templateHTML;
};

// Quên mật khẩu
export const forgotPasswordEmail = (
  fullname: string,
  password: string,
  url: string
) => {
  let templateHTML = `
  <div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tbody>
                <tr align="center">
                  <td>
                    <a href="${APP_CONFIG.APP.FE_URL}" target="_blank">
                      <img src="https://feedback.test.zinisoft.net/images/logo.png" width="252px" height="96px" alt="WKEY"> 
                    </a>
                  </td>
                </tr>
                <tr>
                  <td width="100%" cellpadding="0" cellspacing="0">
                    <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; font-family: Nunito Sans, sans-serif; color: #222222;">
                      <tbody>
                        <tr>
                          <td>
                            <p>Xin chào, <strong>${fullname}</strong>,</p>
                            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu tài khoản của bạn.</p>
                            <p>Mật khẩu mới của bạn là: <strong>${password}</strong></p>

                            <div class="button-active" style="padding-bottom: 16px;">
                              <button class="active" style="padding: 12px 60px; background-color: #125742; border: none; border-radius: 6px;">
                                <a style="color: #dfd9c4; text-decoration: none" href="${url}" target="_blank">Quay lại trang đăng nhập</a>
                              </button>
                            </div>


                            </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </div>`;

  return templateHTML;
};

// Template kích hoạt tài khoản
// export const sendForm = (fullname: string, url: string) => {
//   let templateHTML = `
//   <div>
//     <table width="100%" cellpadding="0" cellspacing="0">
//       <tbody>
//         <tr>
//           <td align="center">
//             <table width="100%" cellpadding="0" cellspacing="0">
//               <tbody>
//                 <tr align="center">
//                   <td>
//                     <a href="${APP_CONFIG.APP.FE_URL}" target="_blank">
//                       <img src="https://feedback.test.zinisoft.net/images/logo.png" width="90px" height="55px" alt="TP">
//                     </a>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td width="100%" cellpadding="0" cellspacing="0">
//                     <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; font-family: Nunito Sans, sans-serif; color: #222222;">
//                       <tbody>
//                         <tr>
//                           <td>
//                             <p>Xin chào anh/chị,</p>
//                             <p>Tiến Phước kính mời anh chị tham gia khảo sát phản hồi cho nhân sự: <strong>${fullname}</strong>.</p>
//                             <p>Anh chị vui lòng nhấp vào liên kết bên dưới để thực hiện khảo sát:</p>
//                             <p><a href="${url}" style="background-color: #2d4432; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Tham gia khảo sát</a></p>
//                             <p>Trân trọng cảm ơn!</p>
//                           </td>
//                         </tr>
//                       </tbody>
//                     </table>
//                   </td>
//                 </tr>

//               </tbody>
//             </table>
//           </td>
//         </tr>
//       </tbody>
//     </table>
//   </div>`;

//   return templateHTML;
// };

export const sendForm = (templateEmail: string) => {
  let templateHTML = `
  <div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tbody>
                <tr align="center">
                  <td>
                    <a href="${APP_CONFIG.APP.FE_URL}" target="_blank">
                      <img src="https://feedback.test.zinisoft.net/images/logo.png" width="90px" height="55px" alt="Tiến Phước"> 
                    </a>
                  </td>
                </tr>
                <tr>
                  <td width="100%" cellpadding="0" cellspacing="0">
                    <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; font-family: Nunito Sans, sans-serif; color: #222222;">
                      <tbody>
                        <tr>
                          <td>
                            ${templateEmail}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </div>`;

  return templateHTML;
};

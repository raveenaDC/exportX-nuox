const appName = process.env.APP_NAME;
const frontendUrl = process.env.FRONTEND_URL;
const backendUrl = process.env.BACKEND_URL;
/**
 * create account template
 * @param {String} name
 * @param {String} email
 * @param {String} password
 * @returns {String}
 */
export const inviteAccountTemplate = (name = '', email = '', loginUrl = '') => {
  return `<div id="wrapper" dir="ltr"
  style="margin: 0; -webkit-text-size-adjust: none !important; padding: 70px 0 70px 0; width: 100%; background-color: #ececec; height: 100vh;">
  <table id="template_container"
      style="box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important; padding: 20px 40px; border: 0; background-color: #39393937; margin: 0 auto; border-radius: 0 !important;"
      width="600" cellspacing="0" cellpadding="0">
      <tbody>
          <tr valign="top">
              <td style="padding:50px;" align="center">
                  <p style="margin: 0; padding: 0 0 15px 0;">
                  <img src="${backendUrl}/cdn/images/exportex-logo.png" width="146px" />
                  </p>
              </td>
          </tr>
          <tr>
              <td>
                  <table style="border: 0; background-color: #fff; padding: 40px 35px 30px 35px;" width="100%"
                      cellspacing="0" cellpadding="0">
                      <tbody>
                          <tr>
                              <td>
                                  <p style="margin: 0; padding: 0;">&nbsp;</p>
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 0;" valign="top">
                                  <!-- Body -->
                                  <p
                                      style="font-weight: bold; font-family: Rubik, Helvetica Neue, Helvetica, Roboto, Arial, sans-serif; line-height: 22px; font-size: 18px; margin-bottom: 10px;">
                                  </p>
                                  <h3
                                      style="text-transform: uppercase;margin: 0px; padding: 0px; color: rgb(255, 35, 35); font-size: 16px; font-family: 'Open Sans', sans-serif; font-weight: 400;margin-bottom:20px;">
                                      Hi ${name}</h3>
                                  <p
                                      style="margin: 0px; padding: 0px; color: #242a38; font-family: Rubik, Helvetica Neue, Helvetica, Roboto, Arial, sans-serif; line-height: 20px; font-size: 13px; font-weight: 400;">
                                      Your email has been successfully changed. Please use the new email and your previous password to log in to your account:<br>
                                      Email: <b>${email}</b><br>
                                     <br><br>

                                      We're thrilled to have you on board and look forward to working with you!<br>
                                      Click the button below to access the login page.
                                  </p>

                                  <a href="${loginUrl}"
                                      style="text-wrap:nowrap; border-radius:25px;text-align: center; text-decoration: none; display: inline-block; padding:8px 15px;color:#FF5017;margin-top: 20px; background-color: #2F2F2F;font-size: 14px; font-family: Rubik, Helvetica Neue, Helvetica, Roboto, Arial, sans-serif;width:100px;">
                                      Login</a>
                                  <!-- <p
                                  style="font-family: Helvetica Neue, Helvetica, Roboto, Arial, sans-serif;line-height: 22px;font-size:14px; margin-bottom:5px;">
                                  <strong>1. Email/ Call your insurance provider:</strong>
                                  </p> -->
                                  <!-- <ul
                                  style="text-align: left; font-family: Helvetica Neue, Helvetica, Roboto, Arial, sans-serif; margin-top:0; padding-left:25px;">
                                  <li
                                      style="font-family: Helvetica Neue, Helvetica, Roboto, Arial, sans-serif; line-height: 20px;font-size:14px;">
                                      This email does not require any further action</li>
                                  <li
                                      style="font-family: Helvetica Neue, Helvetica, Roboto, Arial, sans-serif; margin-top:7px;line-height: 20px;font-size:14px;">
                                      Meanwhile, you can follow us on</li>
                                  </ul> -->
                                  <p
                                      style="font-family: Rubik, Helvetica Neue, Helvetica, Roboto, Arial, sans-serif; line-height: 15px; font-size: 10px; margin: 50px 0 0 0;">
                                      This email and any attachments are confidential and may also be privileged. If
                                      you are not the intended recipient, please delete all copies and notify the
                                      sender immediately</p>
                                  <!-- <p style="margin: 10px 0 0 0;">
                                      <a href="https://www.facebook.com/"><img src="https://apps.element8.ae/email-templates/chaseapp/images/mail-fb.png" width="30px" /></a>
                                      <a href="https://www.instagram.com/"><img src="https://apps.element8.ae/email-templates/chaseapp/images/mail-ins.png" width="30px" /></a>
                                      <a href="https://www.twitter.com/"><img src="https://apps.element8.ae/email-templates/chaseapp/images/mail-tt.png" width="30px" /></a>
                                  </p> -->
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </td>
          </tr>
          <tr>
              <td>
                  <p
                      style="color: #939393; text-align: center; font-family: Rubik, Helvetica Neue, Helvetica, Roboto, Arial, sans-serif; line-height: 15px; font-size: 10px; margin: 0; padding-top: 20px;">
                      Copyrights 2023. All rights reserved <a style="color: #939393;" href="#">Unsubscribe</a> emails
                      from exportx</p>
              </td>
          </tr>
      </tbody>
  </table>
</div>`;
};

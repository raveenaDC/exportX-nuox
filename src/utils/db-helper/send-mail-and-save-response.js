import * as models from '../../db/models/index.js';
import { sendMail } from '../mail.helper.js';
export async function sendMailAndSaveResponse(
  subject = '',
  content = '',
  mail = ''
) {
  const mailResponse = await sendMail(mail, subject, content);

  await models.emailSendModel.create({
    to: mail,
    messageId: mailResponse.messageId,
    subject,
    content,
  });
}

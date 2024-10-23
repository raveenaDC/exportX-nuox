import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from '../config/ses-client.config.js';
const fromAddress = process.env.FROM_MAIL;
/**
 * initialize send email command object
 * @param {String} toAddress
 * @param {String} subject
 * @param {String} template
 * @returns {Object}
 */
const createSendEmailCommand = (
  toAddress = '',
  subject = '',
  template = ''
) => {
  return new SendEmailCommand({
    Destination: {
      /* required */
      //   CcAddresses: [
      //     /* more items */
      //   ],
      ToAddresses: [
        toAddress,
        /* more To-email addresses */
      ],
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: 'UTF-8',
          Data: template,
        },
        // Text: {
        //   Charset: 'UTF-8',
        //   Data: 'TEXT_FORMAT_BODY',
        // },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
    Source: fromAddress,
    ReplyToAddresses: [
      /* more items */
    ],
  });
};

/**
 * send mail using aws sns
 * @param {String} to
 * @param {String} subject
 * @param {String} template
 * @returns {Promise}
 */
export const sendMail = async (to = '', subject = '', template = '') => {
  const sendEmailCommand = createSendEmailCommand(to, subject, template);
  return await sesClient.send(sendEmailCommand);
};

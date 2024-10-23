export const mailConf = {
  senderPassword: process.env.SENDER_PASSWORD,
  expiryTime: process.env.CONFIRM_CODE_EXPIRY_TIME,
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  service: process.env.EMAIL_SERVICE,
};

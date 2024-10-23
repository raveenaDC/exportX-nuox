import { Schema, model } from 'mongoose';
const fromMail = process.env.FROM_MAIL;
const emailSendSchema = new Schema({
  messageId: String,
  from: {
    type: String,
    default: fromMail,
  },
  to: String,
  subject: String,
  content: String,
  sendAt: {
    type: Date,
    default: Date.now,
  },
});

export default model('emailSend', emailSendSchema);

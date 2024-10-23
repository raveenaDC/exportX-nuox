import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    content: String,
    createdByUser: { type: Schema.Types.ObjectId, ref: 'User' },
    createdForUser: { type: Schema.Types.ObjectId, ref: 'User' },
    createdByClient: { type: Schema.Types.ObjectId, ref: 'Client' },
    createdForClient: { type: Schema.Types.ObjectId, ref: 'Client' },
    createdByClientUser: { type: Schema.Types.ObjectId, ref: 'ClientUser' },
    createdForClientUser: { type: Schema.Types.ObjectId, ref: 'ClientUser' },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default model('Notification', notificationSchema);

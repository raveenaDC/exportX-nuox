import { Schema, model } from 'mongoose';

const tokenSchema = new Schema(
  {
    tokenType: String,
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
    },
    clientUserId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientUser',
    },
    token: String,
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
export default model('Token', tokenSchema);

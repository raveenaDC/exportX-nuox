import { Schema, model } from 'mongoose';

const clientUserSchema = new Schema(
  {
    clientUserName: { type: String, required: true },
    clientUserEmail: { type: String },
    clientUserImage: {
      name: String,
      fileName: String,
      path: { type: String, default: '/cdn/images/clientUser.png' },
      uploadedDate: Date,
    },
    contactNo: String,
    isdCode: String,
    country: String,
    isInvite: {
      type: Boolean,
      default: false,
    },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    password: { type: String },
    view: { type: Boolean, default: false },
    action: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model('ClientUser', clientUserSchema);

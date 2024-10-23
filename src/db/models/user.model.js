import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    email: {
      type: String,
      unique: true,
    },
    userImage: {
      name: String,
      fileName: String,
      path: { type: String, default: '/cdn/images/user.png' },
      uploadedDate: Date,
    },
    password: String,
    noOfLoginAttempts: {
      type: Number,
      default: 0,
    },
    loginAttemptExceedMailSended: {
      type: Boolean,
      default: false,
    },
    contactNo: String,
    isdCode: String,
    country: String,
    designation: { type: Schema.Types.ObjectId, ref: 'userDesignation' },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    systemAccess: {
      type: Boolean,
      default: true,
    },
    type: { type: String, default: 'internal' },
    projectId: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    taskId: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  },
  { timestamps: true }
);

export default model('User', userSchema);

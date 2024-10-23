import { Schema, model } from 'mongoose';

const roleSchema = new Schema(
  {
    roleName: String,
    roleDesc: String,
    permission: { type: Schema.Types.ObjectId, ref: 'Permission' },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default model('Role', roleSchema);

import { Schema, Types, model } from 'mongoose';

const userDesignationSchema = new Schema(
  {
    designation: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
export default model('userDesignation', userDesignationSchema);

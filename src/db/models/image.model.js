import { Schema, model } from 'mongoose';

const imageSchema = new Schema(
  {
    name: String,
    fileName: String,
    path: String,
    uploadedDate: {
      type: Date,
      default: new Date(),
    },
  },
  { timestamps: true }
);

export default model('Image', imageSchema);

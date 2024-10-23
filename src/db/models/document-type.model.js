import { Schema, model } from 'mongoose';

const documentTypeSchema = new Schema(
  {
    documentType: String,
  },
  { timestamps: true }
);

export default model('DocumentType', documentTypeSchema);

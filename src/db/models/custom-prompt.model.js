import { Schema, model } from 'mongoose';

const customPromptSchema = new Schema(
  {
    prompt: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default model('customPrompt', customPromptSchema);

import { Schema, model } from 'mongoose';

const savedPrompt = new Schema(
  {
    name: { type: String },
    key: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    language: { type: String },
    subject: { type: String },
    keyPoints: { type: String },
    toneOfVoice: { type: Schema.Types.ObjectId, ref: 'toneOfVoice' },
    targetAudience: { type: String },
    response: { type: String },
    savedPromptHistory: { type: Schema.Types.ObjectId, ref: 'promptHistory' },
  },
  { timestamps: true }
);

export default model('toolSavedEmailDraft', savedPrompt);

import { Schema, model } from 'mongoose';

const savedPrompt = new Schema(
  {
    name: { type: String },
    key: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    language: { type: String },
    platform: { type: String },
    aiTool: { type: String },
    prompt: { type: String },
    approximateWord: { type: Number },
    hashTag: { type: Boolean },
    toneOfVoice: { type: Schema.Types.ObjectId, ref: 'toneOfVoice' },
    targetAudience: { type: String },
    response: { type: String },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    savedPromptHistory: { type: Schema.Types.ObjectId, ref: 'promptHistory' },
  },
  { timestamps: true }
);

export default model('toolSavedIdea', savedPrompt);

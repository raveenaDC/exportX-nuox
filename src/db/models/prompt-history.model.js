import { Schema, model } from 'mongoose';

const promptHistorySchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    name: {
      type: String,
      default: () => new Date().toISOString(),
    },
    language: { type: String },
    isSaved: {
      type: Boolean,
      default: false,
    },
    finalPrompt: {
      type: String,
    },
    response: {
      type: String,
    },
    parentId: { type: Schema.ObjectId },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    prompt: { type: Schema.Types.ObjectId, ref: 'prompt' },
    customPrompt: { type: Schema.Types.ObjectId, ref: 'customPrompt' },
    translatePrompt: {
      type: Schema.Types.ObjectId,
      ref: 'languageTranslatePrompt',
    },
    transformPrompt: { type: Schema.Types.ObjectId, ref: 'transformPrompt' },
    input: { type: String },
    key: { type: String },
  },

  { timestamps: true }
);

export default model('promptHistory', promptHistorySchema);

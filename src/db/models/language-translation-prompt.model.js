import { Schema, model } from 'mongoose';

const languageTranslationPromptSchema = new Schema(
  {
    language: {
      type: String,
      unique: true,
    },
    key: {
      type: String,
      unique: true,
    },
    prompt: {
      type: String,
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
languageTranslationPromptSchema.pre('validate', function (next) {
  this.key = this.key || this.language.toLowerCase();

  console.log(this.key);
  next();
});
export default model(
  'languageTranslatePrompt',
  languageTranslationPromptSchema
);

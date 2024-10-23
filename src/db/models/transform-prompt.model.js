import { Schema, model } from 'mongoose';

const transformPromptSchema = new Schema(
  {
    name: {
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
transformPromptSchema.pre('validate', function (next) {
  this.key = this.key || this.name.toLowerCase();

  console.log(this.key);
  next();
});

export default model('transformPrompt', transformPromptSchema);

import { Schema, model } from 'mongoose';

const toneOfVoiceSchema = new Schema(
  {
    toneOfVoice: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

export default model('toneOfVoice', toneOfVoiceSchema);

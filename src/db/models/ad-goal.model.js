import { Schema, model } from 'mongoose';

const adGoalSchema = new Schema(
  {
    adGoal: { type: String, unique: true },
  },
  { timestamps: true }
);

export default model('AdGoal', adGoalSchema);

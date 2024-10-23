import { Schema, model } from 'mongoose';

const taskSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: String,
    name: String,
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: [
        'Pending',
        'In Progress',
        'Completed',
        'Submit For Approval',
        'Rework Required',
        'Approved',
      ],
      default: 'Pending',
    },
    stage: String,
    note: String,
  },
  { timestamps: true }
);
export default model('Task', taskSchema);

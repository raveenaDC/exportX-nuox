import { Mongoose, Schema, Types, model } from 'mongoose';
const socialMediaPlannerSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    title: String,
    isTool: {
      default: false,
      type: Boolean,
    },
    items: {
      imageIdeas: [],
      scheduledDate: {
        type: Date,
        default: null,
      },
      dallePrompt: String,
      approval: {
        status: {
          type: String,
          enum: [
            'Inprogress',
            'Rework',
            'Approved',
            'SubmitToClient',
            'ReworkByClient',
            'Rejected',
            'RejectedByClient',
            'ApprovedByClient',
            // 'Scheduled'
          ],
          default: 'Inprogress',
        },
        comments: [
          {
            comment: String,
            date: {
              type: Date,
              default: new Date(),
            },
            commentedBy: {
              type: Types.ObjectId,
              ref: 'User',
            },
          },
        ],
      },
      posts: [
        {
          parentId: { type: Schema.Types.ObjectId, ref: 'promptHistory' },
          platform: {
            type: String,
            enum: ['instagram', 'facebook', 'linkedin', 'x'],
          },
          images: [
            {
              type: Schema.Types.ObjectId,
              ref: 'Image',
            },
          ],
          post: String,
        },
      ],
      dalleGeneratedImages: [
        {
          image: { type: Schema.Types.ObjectId, ref: 'Image' },
          path: String,
        },
      ],
      createdAt: Date,
    },
  },
  { timestamps: true }
);

export default model('socialMediaPlanner', socialMediaPlannerSchema);

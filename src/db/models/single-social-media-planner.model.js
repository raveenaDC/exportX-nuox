import { Schema, model, Types } from 'mongoose';

const singleSocialMediaPlanSchema = new Schema(
  {
    settings: {
      language: {
        english: {
          type: Boolean,
          default: true,
        },
        arabic: {
          type: Boolean,
          default: true,
        },
      },
      socialMediaPlatforms: {
        instagram: {
          type: Boolean,
          default: true,
        },
        facebook: {
          type: Boolean,
          default: true,
        },
        twitter: {
          type: Boolean,
          default: true,
        },
        linkedin: {
          type: Boolean,
          default: true,
        },
      },
      aiTool: {
        openAI: {
          type: Boolean,
          default: true,
        },
        bard: {
          type: Boolean,
          default: true,
        },
        dalle: {
          type: Boolean,
          default: true,
        },
      },
    },
    feedAiDetails: {
      adGoals: {
        type: Types.ObjectId,
        ref: 'AdGoal',
      },
      toneOfVoice: {
        type: Types.ObjectId,
        ref: 'toneOfVoice',
      },
      targetAudience: [
        {
          type: String,
        },
      ],
      productOrService: String,
      briefDescription: String,
      tagIdeas: [{ type: String }],
    },
    contentIdeas: {
      english: [{ title: String, content: String, selected: Boolean }],
      arabic: [{ title: String, content: String, selected: Boolean }],
    },
    posts: [
      {
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
    aiGeneratedImages: [
      {
        image: { type: Schema.Types.ObjectId, ref: 'Image' },
        path: String,
      },
    ],
    title: String,
    imageIdeas: [String],
    dallePrompt: String,
  },
  { timestamps: true }
);

export default model('singleSocialMediaPlan', singleSocialMediaPlanSchema);

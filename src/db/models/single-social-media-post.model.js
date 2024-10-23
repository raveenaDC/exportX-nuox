import { Schema, model, Types } from 'mongoose';

const singleSocialMediaPostSchema = new Schema(
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
      socialMediaPlatform: {
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
      brandDescription: String,
      tagIdeas: [{ type: String }],
    },
    contentIdeas: {
      english: [{ title: String, content: String, selected: Boolean }],
      arabic: [{ title: String, content: String, selected: Boolean }],
    },
    posts: {
      instagram: {
        englishPost: String,
        arabicPost: String,
        images: [
          {
            type: Types.ObjectId,
            ref: 'Image',
          },
        ],
      },
      facebook: {
        englishPost: String,
        arabicPost: String,
        images: [
          {
            type: Types.ObjectId,
            ref: 'Image',
          },
        ],
      },

      linkedin: {
        englishPost: String,
        arabicPost: String,
        images: [
          {
            type: Types.ObjectId,
            ref: 'Image',
          },
        ],
      },
      twitter: {
        englishPost: String,
        arabicPost: String,
        images: [
          {
            type: Types.ObjectId,
            ref: 'Image',
          },
        ],
      },
    },
    title: String,
    imageIdeas: [String],
    dallePrompt: String,
    dalleGeneratedImages: [
      {
        image: { type: Schema.Types.ObjectId, ref: 'Image' },
        path: String,
      },
    ],
  },
  { timestamps: true }
);

export default model('singleSocialMediaPost', singleSocialMediaPostSchema);

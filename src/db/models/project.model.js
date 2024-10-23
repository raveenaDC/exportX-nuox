import { Schema, model } from 'mongoose';

let discussion = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  message: String,
  date: Date,
  time: String,
});

const document = new Schema({
  name: String,
  fileName: String,
  path: String,
  uploadedDate: {
    type: Date,
    defaultValue: new Date(),
  },
});

const projectSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    name: String,
    type: String,
    owner: { type: Schema.Types.ObjectId, ref: 'ClientUser' },
    description: String,
    startDate: Date,
    endDate: Date,
    documents: [document],
    documentType: { type: Schema.Types.ObjectId, ref: 'DocumentType' },
    images: [
      {
        name: String,
        fileName: String,
        path: String,
        uploadedDate: Date,
      },
    ],
    projectCoordinators: [
      {
        projectCoordinator: { type: Schema.Types.ObjectId, ref: 'User' },
        isProjectManager: { type: Boolean, default: false },
      },
    ],
    clientUsers: [
      {
        clientUser: { type: Schema.Types.ObjectId, ref: 'ClientUser' },
        isClientCoordinator: { type: Boolean, default: false },
      },
    ],
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    discuss: [discussion],
    status: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'Ongoing', 'Completed'],
    },
    contentPlanner: {
      settings: {
        languages: {
          english: {
            type: Boolean,
            default: false,
          },
          arabic: {
            type: Boolean,
            default: false,
          },
        },
        platforms: {
          facebook: {
            type: Boolean,
            default: false,
          },
          instagram: {
            type: Boolean,
            default: false,
          },
          linkedin: {
            type: Boolean,
            default: false,
          },
          x: {
            type: Boolean,
            default: false,
          },
        },
        aiTool: {
          openAi: {
            type: Boolean,
            default: false,
          },
          bard: {
            type: Boolean,
            default: false,
          },
          dalle: {
            type: Boolean,
            default: false,
          },
        },
      },
      contentIdeas: {
        contentEnglish: [
          {
            title: String,
            content: String,
            selected: Boolean,
          },
        ],
        contentsArabic: [
          {
            title: String,
            content: String,
            selected: Boolean,
          },
        ],
      },
      socialMediaPlanner: [
        {
          plan: {
            type: Schema.Types.ObjectId,
            ref: 'socialMediaPlanner',
          },
          language: String,
        },
      ],
      dalleGeneratedImages: [
        {
          image: { type: Schema.Types.ObjectId, ref: 'Image' },
          path: String,
        },
      ],
    },
    projectBrief: {
      adGoals: { type: Schema.Types.ObjectId, ref: 'AdGoal' },
      toneOfVoice: { type: Schema.Types.ObjectId, ref: 'toneOfVoice' },
      callToAction: String,
      targetAudience: String,
      productServiceName: String,
      briefDescription: String,
      pillars: String,
      observationDays: String,
    },
    clientBrief: {
      adGoals: { type: Schema.Types.ObjectId, ref: 'AdGoal' },
      toneOfVoice: { type: Schema.Types.ObjectId, ref: 'toneOfVoice' },
      targetAudience: String,
      productServiceName: String,
      briefDescription: String,
    },
   
    designBrief: {
      background: String,
      targetAudience: String,
      deliverables: String,
      toneOfVoice: { type: Schema.Types.ObjectId, ref: 'toneOfVoice' },
      additionalInfo: String,
    },

    tagIdeas: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export default model('Project', projectSchema);

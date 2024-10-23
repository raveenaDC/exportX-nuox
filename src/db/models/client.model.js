import { Schema, model } from 'mongoose';

let brandKitDetails = new Schema(
  {
    logo: {
      name: String,
      fileName: String,
      path: String,
      uploadedDate: Date,
    },
    mainBrandColor: String,
    brandKitSubheadingCode: String,
    brandKitDescriptionColorCode: String,
    //  alternativeColorCode: String,
    alternativeColorCode: [{ type: String }],
    brandPattern: [
      {
        pattern: {
          name: String,
          fileName: String,
          path: String,
          uploadedDate: Date,
        },
      },
    ],
    brandFont: [{ type: String }],
  },
  { timestamps: true }
);

let clientBriefDetails = new Schema(
  {
    adGoals: { type: Schema.Types.ObjectId, ref: 'AdGoal' },
    toneOfVoice: { type: Schema.Types.ObjectId, ref: 'toneOfVoice' },
    targetAudience: String,
    productServiceName: String,
    briefDescription: String,
  },
  { timestamps: true }
);

const clientSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    clientImage: {
      name: String,
      fileName: String,
      path: { type: String, default: '/cdn/images/user.png' },
      uploadedDate: Date,
    },
    primaryContactNo: String,
    primaryIsdCode: String,
    secContactNo: String,
    secIsdCode: String,
    country: String,
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    systemAccess: {
      type: Boolean,
      default: true,
    },
    brandUrl: String,
    brandName: String,
    brandDescription: String,
    logoImage: {
      name: String,
      fileName: String,
      path: { type: String, default: '/cdn/images/logo3.jpg' },
      uploadedDate: Date,
    },
    waterMarkImage: {
      name: String,
      fileName: String,
      path: { type: String, default: '/cdn/images/logo2.png' },
      uploadedDate: Date,
    },
    brandColorCode: String,
    subheadingColorCode: String,
    descriptionColorCode: String,
    brandKit: brandKitDetails,
    templates: [
      {
        template: {
          name: String,
          fileName: String,
          path: String,
          uploadedDate: Date,
        },
      },
    ],
    template: {
      type: [[Schema.Types.Mixed]],
      default: [],
    },
    clientBrief: clientBriefDetails,
    clientSocialMedia: [
      {
        media: String,
        mediaToken: String,
      },
    ],
  },
  { timestamps: true }
);

export default model('Client', clientSchema);

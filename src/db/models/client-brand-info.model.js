import { Schema, model } from 'mongoose';


const brandInformationSchema = new Schema(
  {
    clientId:{ type: Schema.Types.ObjectId, ref: 'Client' },
    brandSiteUrl: String,
    brandInfoName: String,
    brandDescription: String,
    brandMainColorCode: String,
    brandSubheadingColorCode: String,
    brandDescriptionColorCode: String,
    brandAlternativeColorCode: [{ type: String }],
    logos: [{
      name: String,
      fileName: String,
      path: { type: String, default: '/cdn/images/logo3.jpg' },
      uploadedDate: Date,
    }],
    campaignAbout: String,
    brandProblem: String,
    brandPerception: String,
    brandDestination: String,
    communicationRole: String,
    targetSegment: String,
    keyDesire: String,
    sellingIdea: String,
    toneOfVoice: String,
    requirements: String,
    watchOut: String,
  },
  { timestamps: true }
);

export default model('ClientBrandInfo', brandInformationSchema);

import { clientFinetune } from '../../utils/db-helper/client-fine-tune.js';
import { designFinetune } from '../../utils/db-helper/design-fine-tune.js';
import promptModel from '../../db/models/prompt.model.js';
import clientBrandInfoModel from '../../db/models/client-brand-info.model.js';

export async function imageGenerationParamsPrompt(
  project,
  postIdeas,
  language
) {
  const prompts = await promptModel.findOne({
    key: 'image_ideas_and_dalle_prompt_generator',
  });
  let params = prompts.information + '\n\n' + prompts.instruction;
  let brandInfo = await clientBrandInfoModel.find({
    clientId: project.clientId,
  });
  console.log(brandInfo[0]);

  const clientDetails = await clientFinetune(brandInfo[0], language);
  const designDetails = await designFinetune(
    project.designBrief || '',
    language
  );

  const dataSet = {
    adGoal: project?.projectBrief?.adGoals?.adGoal,
    toneOfVoice: project?.projectBrief?.toneOfVoice?.toneOfVoice,
    targetAudience: project?.projectBrief?.targetAudience,
    productServiceName: project?.projectBrief?.productServiceName,
    briefDescription: project?.projectBrief?.briefDescription,
    pillars: project?.projectBrief?.pillars,
    observationDays: project?.projectBrief?.observationDays,
    language: language,
    designBrief: designDetails,
    clientBrief: clientDetails,
    postIdeas: postIdeas,
  };

  const dbKeys = params.match(/[^\[\]]+(?=\])/g);
  for (const key in dataSet) {
    if (!dbKeys.includes(key)) {
      delete dataSet[key];
    }
  }

  for (const key in dataSet) {
    if (dataSet[key] !== undefined && dataSet[key] !== null) {
      const regex = new RegExp('\\[' + key + '\\]', 'g');
      params = params.replace(regex, dataSet[key]);
    } else {
      const regex = new RegExp('\\[' + key + '\\]', 'g');
      params = params.replace(regex, '');
    }
  }

  return params;
}

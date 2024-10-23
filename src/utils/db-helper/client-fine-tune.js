import { generateOpenAiText, generateBardText } from '../ai/ai-helper.js';
import * as models from '../../db/models/index.js';
export async function clientFinetune(clientBrief, language) {
  const prompts = await models.promptModel.findOne({
    key: 'client_brief_prompt',
  });
  const dbPrompt = prompts.information + '\n\n' + prompts.instruction;

  const clientSet = {
    brandSiteUrl : clientBrief.brandSiteUrl,
    brandInfoName : clientBrief.brandInfoName,
    campaignAbout :  clientBrief.campaignAbout,
    brandProblem :  clientBrief.brandProblem,
    brandPerception :  clientBrief.brandPerception,
    brandDestination :  clientBrief.brandDestination,
    communicationRole :  clientBrief.communicationRole,
    targetSegment :  clientBrief.targetSegment,
    keyDesire :  clientBrief.keyDesire,
    sellingIdea :  clientBrief.sellingIdea,
    toneOfVoice :   clientBrief.toneOfVoice,
    requirements :  clientBrief.requirements,
    watchOut :  clientBrief.watchOut,
    language: language,
  };

  const dbKeys = dbPrompt.match(/[^\[\]]+(?=\])/g);
  for (const key in clientSet) {
    // Check if the key exists in dbKeys
    if (!dbKeys.includes(key)) {
      // Remove the key-value pair from the clientSet
      delete clientSet[key];
    }
  }
  let actualValuedbPrompt = dbPrompt;
  for (const key in clientSet) {
    if (clientSet[key] !== undefined && clientSet[key] !== null) {
      const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
      actualValuedbPrompt = actualValuedbPrompt.replace(regex, clientSet[key]); // Replace the placeholder with the actual value
    } else {
      const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
      actualValuedbPrompt = actualValuedbPrompt.replace(regex, ''); // Remove the placeholder
    }
  }
  const aiResponse = await generateOpenAiText(actualValuedbPrompt);

  return aiResponse;
}
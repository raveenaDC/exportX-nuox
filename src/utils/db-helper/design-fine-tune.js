import { generateOpenAiText, generateBardText } from '../ai/ai-helper.js';
import * as models from '../../db/models/index.js';
export async function designFinetune(designBrief, language) {
  const prompts = await models.promptModel.findOne({
    key: 'design_brief_prompt',
  });
  const dbPrompt = prompts.information + '\n\n' + prompts.instruction;

  const designSet = {
    toneOfVoice: designBrief?.toneOfVoice?.toneOfVoice,
    background: designBrief?.background,
    targetAudience: designBrief?.targetAudience,
    deliverables: designBrief?.deliverables,
    information: designBrief?.information,
    language: language,
  };

  const dbKeys = dbPrompt.match(/[^\[\]]+(?=\])/g);
  for (const key in designSet) {
    // Check if the key exists in dbKeys
    if (!dbKeys.includes(key)) {
      // Remove the key-value pair from the clientSet
      delete designSet[key];
    }
  }
  let actualValuedbPrompt = dbPrompt;
  for (const key in designSet) {
    if (designSet[key] !== undefined && designSet[key] !== null) {
      const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
      actualValuedbPrompt = actualValuedbPrompt.replace(regex, designSet[key]); // Replace the placeholder with the actual value
    } else {
      const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
      actualValuedbPrompt = actualValuedbPrompt.replace(regex, ''); // Remove the placeholder
    }
  }
  const aiResponse = await generateOpenAiText(actualValuedbPrompt);

  return aiResponse;
}

import * as models from '../../db/models/index.js';
export async function projectBriefData(
  projectBrief,
  language,
  clientData,
  key,
  prompt=''
) {
  const prompts = await models.promptModel.findOne({
    key: key,
  });
  const dbPrompt = prompts.information + '\n\n' + prompts.instruction;
  const dataSet = {
    adGoal: projectBrief?.adGoals?.adGoal,
    toneOfVoice: projectBrief?.toneOfVoice?.toneOfVoice,
    targetAudience: projectBrief?.targetAudience,
    productServiceName: projectBrief?.productServiceName,
    briefDescription: projectBrief?.briefDescription,
    pillars:projectBrief?.pillars,
    observationDays:projectBrief?.observationDays,
    language: language,
    clientBrief: clientData,
    prompt: prompt,
  };

  const dbKeys = dbPrompt.match(/[^\[\]]+(?=\])/g);
  for (const key in dataSet) {
    // Check if the key exists in dbKeys
    if (!dbKeys.includes(key)) {
      // Remove the key-value pair from the dataSet
      delete dataSet[key];
    }
  }
  let actualValuedbPrompt = dbPrompt;
  for (const key in dataSet) {
    if (dataSet[key] !== undefined && dataSet[key] !== null) {
      const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
      actualValuedbPrompt = actualValuedbPrompt.replace(regex, dataSet[key]); // Replace the placeholder with the actual value
    } else {
      const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
      actualValuedbPrompt = actualValuedbPrompt.replace(regex, ''); // Remove the placeholder
    }
  }
  return actualValuedbPrompt;
}

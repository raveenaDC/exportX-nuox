export function contentRegeneratePrompt(key = '', toneOfVoice, hashTag) {
  if (key !== 'tool_campaign_idea')
    throw new Error('invalid prompt key provided (tool_campaign_idea)');
  if (!toneOfVoice) {
    throw new Error('toneOfVoice is required');
  }
  let promptString = `Strictly follow the format. Generate the response in the following format 
  <h3><b>heading for the campaign ideas<b></h3>
    <p> <heading>1. title for the idea </heading> : <content></p>
    <p> <heading>2. title for the idea </heading> : <content></p> etc `;
  if (!hashTag) {
    promptString += 'Do not generate hashtags in the response.';
  }
  if (hashTag) {
    promptString += `Generate hashtags at the bottom of the response .`;
  }
  return promptString;
}

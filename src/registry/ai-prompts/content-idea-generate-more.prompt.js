export function contentIdeaGenerateMorePrompt(
  // key = '',
  // clientBrief,
  projectBrief
  // contentIdeas = [],
  // language
) {
  // if (key !== 'generate_more_content_ideas')
  //   throw new Error(
  //     'invalid prompt key provided (generate_more_content_ideas)'
  //   );
  // if (!clientBrief && !projectBrief) {
  //   throw new Error('client brief and project brief are required');
  // }
  // if (!contentIdeas) {
  //   throw new Error('contentIdeas is required');
  // }
  // let firstSection, secondSection;
  // if (clientBrief) {
  //   const {
  //     adGoals,
  //     toneOfVoice,
  //     targetAudience,
  //     productServiceName,
  //     briefDescription,
  //   } = clientBrief;
  //   firstSection =
  //     `clientBrief: \n\n` +
  //     (adGoals ? `Ad Goals: ${adGoals?.adGoal} \n` : '') +
  //     (toneOfVoice ? `Tone of Voice: ${toneOfVoice?.toneOfVoice} \n` : '') +
  //     (targetAudience ? `Target Audience : ${targetAudience} \n` : '') +
  //     (productServiceName
  //       ? `Product Or Service: ${productServiceName} \n`
  //       : '') +
  //     (briefDescription ? `Description: ${briefDescription} \n` : '');
  // }
  if (projectBrief) {
    const {
      adGoals,
      toneOfVoice,
      targetAudience,
      productServiceName,
      briefDescription,
    } = projectBrief;
    secondSection =
      `projectBrief: \n\n` +
      (adGoals ? `Ad Goals: ${adGoals} \n` : '') +
      (toneOfVoice ? `Tone of Voice: ${toneOfVoice} \n` : '') +
      (targetAudience ? `Target Audience : ${targetAudience} \n` : '') +
      (productServiceName
        ? `Product Or Service: ${productServiceName} \n`
        : '') +
      (briefDescription ? `Description: ${briefDescription} \n` : '');
  }
  // let thirdSection = `Regenerate contents only based on project brief projectBrief.You should  use ${language} as language  for title and content.Regenerate the contents that need to be different from the existing contentIdeas \n\n selectedIdeas: ${contentIdeas
  //   .map((idea) => `title: ${idea?.title} \ncontent: ${idea?.content}`)
  //   .join('\n\n')} \n\n`;
  return firstSection + secondSection + thirdSection;
}

export function contentIdeaPrompt(
  key = '',
  clientBrief,
  projectBrief,
  language
) {
  if (key !== 'content_ideas')
    throw new Error('invalid prompt key provided (content_idea)');
  if (!clientBrief && !projectBrief) {
    throw new Error('client brief and project brief are required');
  }

  let firstSection, secondSection;
  if (clientBrief) {
    const {
      adGoals,
      toneOfVoice,
      targetAudience,
      productServiceName,
      briefDescription,
    } = clientBrief;

    firstSection =
      `\n\nclientBrief: \n\n` +
      (adGoals ? `Ad Goals: ${adGoals?.adGoal} \n` : '') +
      (toneOfVoice ? `Tone of Voice: ${toneOfVoice?.toneOfVoice} \n` : '') +
      (targetAudience ? `Target Audience : ${targetAudience} \n` : '') +
      (productServiceName
        ? `Product Or Service: ${productServiceName} \n`
        : '') +
      (briefDescription ? `Description: ${briefDescription} \n` : '');
  }

  if (projectBrief) {
    const {
      adGoals,
      toneOfVoice,
      targetAudience,
      productServiceName,
      briefDescription,
    } = projectBrief;

    secondSection =
      `\n\nprojectBrief: \n\n` +
      (adGoals ? `Ad Goals: ${adGoals} \n` : '') +
      (toneOfVoice ? `Tone of Voice: ${toneOfVoice} \n` : '') +
      (targetAudience ? `Target Audience : ${targetAudience} \n` : '') +
      (productServiceName
        ? `Product Or Service: ${productServiceName} \n`
        : '') +
      (briefDescription ? `Description: ${briefDescription} \n` : '');
  }
  return firstSection + secondSection;
}

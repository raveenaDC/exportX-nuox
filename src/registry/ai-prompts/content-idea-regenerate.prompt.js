export function contentIdeaRegeneratePrompt(
  key = '',
  clientBrief,
  projectBrief,
  title = '',
  content = ''
) {
  if (key !== 'content_idea_regenerate')
    throw new Error('invalid prompt key provided (content_idea_regenerate)');
  if (!clientBrief && !projectBrief) {
    throw new Error('client brief and project brief are required');
  }

  if (!title && !content) {
    throw new Error('title and content are required');
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
      `clientBrief: \n\n` +
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
      `projectBrief: \n\n` +
      (adGoals ? `Ad Goals: ${adGoals} \n` : '') +
      (toneOfVoice ? `Tone of Voice: ${toneOfVoice} \n` : '') +
      (targetAudience ? `Target Audience : ${targetAudience} \n` : '') +
      (productServiceName
        ? `Product Or Service: ${productServiceName} \n`
        : '') +
      (briefDescription ? `Description: ${briefDescription} \n` : '');
  }

  let thirdSection = `Regenerate contents only based on project brief ${projectBrief}.title: ${title} \ncontent: ${content} and make sure the content should be different from the previous ${content}.\n`;

  return firstSection + secondSection + thirdSection;
}

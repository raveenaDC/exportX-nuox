export function socialMediaPlannerPrompt(
  key = '',
  clientBrief,
  projectBrief,
  contentIdeas
) {
  if (key !== 'social_media_planner')
    throw new Error('invalid prompt key provided (social_media_planner)');
  if (!clientBrief && !projectBrief) {
    throw new Error('clientBrief or projectBrief is required');
  }

  if (!contentIdeas || !contentIdeas.length == 0) {
    throw new Error('contentIdeas is required');
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
      `Ad Goals: ${adGoals?.adGoal} \n` +
      `Tone of Voice: ${toneOfVoice?.toneOfVoice} \n` +
      `Target Audience : ${targetAudience} \n` +
      `Product Or Service: ${productServiceName} \n` +
      `Description: ${briefDescription} \n`;
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
      `Ad Goals: ${adGoals?.adGoal} \n` +
      `Tone of Voice: ${toneOfVoice?.toneOfVoice} \n` +
      `Target Audience : ${targetAudience} \n` +
      `Product Or Service: ${productServiceName} \n` +
      `Description: ${briefDescription} \n`;
  }

  const thirdSection =
    'Content Ideas:\n\n' +
    'English:\n\n' +
    (contentIdeas.contentEnglish && contentIdeas.contentEnglish.length > 0
      ? contentIdeas.contentEnglish
          .filter((content) => content.selected)
          .map(
            (content) =>
              `title: ${content.title}\ncontent: ${content.content}\n\n`
          )
          .join(' ')
      : '') +
    '\n\n' +
    'Arabic:\n\n' +
    (contentIdeas.contentsArabic && contentIdeas.contentsArabic.length > 0
      ? contentIdeas.contentsArabic
          .filter((content) => content.selected)
          .map(
            (content) =>
              `title: ${content.title}\ncontent: ${content.content}\n\n`
          )
          .join(' ')
      : '');

  return firstSection + secondSection + thirdSection;
}

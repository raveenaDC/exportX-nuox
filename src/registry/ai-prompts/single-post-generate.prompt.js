export function singlePostGeneratePrompt(
  key = '',
  clientBrief,
  projectBrief,
  contentIdeas = [],
  language,
  platform = ''
) {
  if (key !== 'generate_single_post')
    throw new Error('invalid prompt key provided (generate_single_post)');
  if (!clientBrief && !projectBrief) {
    throw new Error('clientBrief or projectBrief is required');
  }

  if (!contentIdeas) {
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

  let thirdSection = '\n';
  if (contentIdeas.length > 0) {
    thirdSection =
      'Content Ideas: \n\n' +
      contentIdeas
        .map((idea) => `\n title: ${idea?.title} \n content : ${idea?.content}`)
        .join('\n\n') +
      '\n\n';
  }

  let fourthSection = `Generate contents based on projectBrief. Use ${language} as response language: Generate a post for ${platform} , in the format of json {platform:"${platform}",post:""}]\n`;

  return firstSection + secondSection + thirdSection + fourthSection;
}

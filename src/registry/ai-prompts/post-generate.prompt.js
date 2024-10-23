export function postGeneratePrompt(
  //key = '',
  // clientBrief,
  // projectBrief,
  contentIdeas = [],
  language,
  selectedPlatforms = {
    twitter: true,
    facebook: true,
    instagram: true,
    linkedin: true,
  }
) {
  // if (key !== 'generate_posts')
  //   throw new Error('invalid prompt key provided (generate_posts)');
  // if (!clientBrief && !projectBrief) {
  //   throw new Error('client brief and project brief are required');
  // }
  // if (!contentIdeas) {
  //   throw new Error('content ideas are required');
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
  //     (adGoals?`Ad Goals: ${adGoals?.adGoal} \n`:'') +
  //     (toneOfVoice ? `Tone of Voice: ${toneOfVoice?.toneOfVoice} \n` : '') +
  //     (targetAudience ? `Target Audience : ${targetAudience} \n` : '') +
  //     (productServiceName
  //       ? `Product Or Service: ${productServiceName} \n`
  //       : '') +
  //     (briefDescription?`Description: ${briefDescription} \n`:'');
  // }
  // if (projectBrief) {
  //   const {
  //     adGoals,
  //     toneOfVoice,
  //     targetAudience,
  //     productServiceName,
  //     briefDescription,
  //   } = projectBrief;
  //   secondSection =
  //     `projectBrief: \n\n` +
  //     (adGoals ? `Ad Goals: ${adGoals} \n` : '') +
  //     (toneOfVoice ? `Tone of Voice: ${toneOfVoice} \n` : '') +
  //     (targetAudience ? `Target Audience : ${targetAudience} \n` : '') +
  //     (productServiceName ? `Product Or Service: ${productServiceName} \n` : '') +
  //     (briefDescription ? `Description: ${briefDescription} \n` : '');
  // }
  let thirdSection = '\n';
  if (contentIdeas.length > 0) {
    for (const platform in selectedPlatforms) {
      if (selectedPlatforms[platform]) {
        const platformContent = contentIdeas.filter(
          (idea) => idea.platform === platform
        );
        if (platformContent.length > 0) {
          thirdSection += `Content Ideas for ${platform}:
          `;
          for (const idea of platformContent) {
            thirdSection += `Title: ${idea?.title} 
            Content: ${idea?.content} 
            `;
          }
        }
      }
    }
  }
  let fourthSection = `${JSON.stringify(selectedPlatforms)}`;
  // let fifthSection = `Generate contents based on ${projectBrief}. Use ${language} language to generate dallePrompt and content. dallePrompt and the content should not be same: `;
  // let sixthSection = `\nUse ${
  //   language === 'arabic' ? 'Arabic' : 'English'
  // } as the language\n`;
  return (
    // firstSection +
    // secondSection +
    thirdSection + fourthSection
    // fifthSection +
    // sixthSection
  );
}

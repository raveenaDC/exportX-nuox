export function imageIdeaRegeneratePromptV2(
  key = '',
  imageIdeas = [],
  language
) {
  if (key !== 'image_ideas_regenerate')
    throw new Error('invalid prompt key provided (image_ideas_regenerate)');
  const imageIdeasString = imageIdeas.map((ideas) => ideas + '/n').join('/n');

  return `\n\nimage ideas: ${imageIdeasString}
          \n\n Use ${language} as response language.`;
}

export function imageRegenerationPrompt(
  key = '',
  postIdeas = [],
  imageIdeas = [],
  dallePrompt = '',
  language = 'english'
) {
  if (key !== 'post_ideas_and_dalle_prompt_regenerator') {
    throw new Error(
      'invalid prompt key provided (post_ideas_and_dalle_prompt_regenerator)'
    );
  }

  if (imageIdeas.length === 0)
    throw new Error('at least one image idea is required');
  if (postIdeas.length === 0)
    throw new Error('at least one post idea is required');

  const postIdeasString = Object.entries(postIdeas)
    .map((post) => `${post[0]}\npost:${post[1].post}`)
    .join('\n\n');
  const imageIdeaString = imageIdeas.map((idea) => `${idea}\n\n`).join('\n\n');

  return `post ideas :\n.${postIdeasString} \n\n.Old Details :\n\n imageIdeas: \n\n${imageIdeaString} \n.dallePrompt: ${dallePrompt}\n\n`;
}

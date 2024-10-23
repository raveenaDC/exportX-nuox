export function imageGenerationPrompt(key = '', posts, language) {
  if (key !== 'image_ideas_and_dalle_prompt_generator') {
    throw new Error(
      'invalid prompt key provided (image_ideas_and_dalle_prompt_generator)'
    );
  }
  if (posts.length === 0) throw new Error('at least one post is required');

  const postString = posts
    .map((post) => `platform: ${post.platform} post: ${post.post}`)
    .join('');

  return `Please generate dallePrompt in json of format : { imageIdeas:['','',...],dallePrompt:'' }.
Post ideas :
${postString}
Generate dallePrompt and imageIdeas using ${language} language.the dallePrompt should be different from the posts content: 
`;
}

export function postRegeneratePrompt(
  key = '',
  socialMediaPlatform = '',
  post = '',
  language,
  isGeneratingForTool = false
) {
  if (key !== 'regenerate_single_post')
    throw new Error(
      'invalid prompt key provided expected: regenerate_single_post'
    );
  if (!socialMediaPlatform) throw new Error('socialMediaPlatform is required');
  return `Regenerate ${socialMediaPlatform} post
  Post : ${post}
  Regenerate in following json format: { platform:"${socialMediaPlatform}",post:"regenerated different content post"}.add regenerated hashtags and emoji if needed using given language ${language}.`;
}
export function tagIdeaGeneratePrompt(
  key = '',
  productServiceName = '',
  description = ''
) {
  if (key !== 'generate_tag_ideas')
    throw new Error('invalid prompt key provided expected: generate_tag_ideas');
  return `productServiceName:"${productServiceName}" 
description:"${description}"
`;
}

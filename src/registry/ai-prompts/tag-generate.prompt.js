export function tagIdeaGeneratePrompt(
  key = '',
  productServiceName = '',
  description = ''
) {
  if (key !== 'generate_tag_ideas')
    throw new Error('invalid prompt key provided expected: generate_tag_ideas');

  return `productServiceName:"${productServiceName}" /n/n description:"${description}"`;
}

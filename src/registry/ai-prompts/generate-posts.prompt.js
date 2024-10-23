export function generatePostsPrompt(
  key = '',
  projectBrief,
  title = '',
  content = ''
) {
  if (key !== 'generate_posts')
    throw new Error('invalid prompt key provided (generate_posts)');
  if (!title) throw new Error('title is required');
  if (!content) throw new Error('content is required');
  if (!projectBrief) throw new Error('project brief is required');

  return `   
    project Brief:
    adGoal: '${projectBrief?.adGoal}'
    tone of voice: '${projectBrief?.toneOfVoice}'
    targetAudience: '${projectBrief?.targetAudience}',
    productServiceName: '${projectBrief?.productServiceName}'
    Description: "${projectBrief?.briefDescription}"
    ideaTitle: "${title}"
    ideaContent: "${content}"
    \n\n`;
}

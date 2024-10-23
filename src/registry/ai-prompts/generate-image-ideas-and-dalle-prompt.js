export function generatePostsPrompt(
  key = '',
  settings,
  title = '',
  content = ''
) {
  if (key !== 'generate_posts')
    throw new Error('invalid prompt key provided (generate_posts)');
  if (!title) throw new Error('title is required');
  if (!content) throw new Error('content is required');
  if (!settings) throw new Error('settings is required');

  const settingsString = JSON.stringify(settings);

  return `Please answer me as expert of social media content idea generator , your task is to generate social media post contents (each must be at least 10 paragraphs long) by considering following information.
    add hash tags and emojis if needed.
    title: "${title}"
    content: "${content}"
    social media platforms :  ${settingsString}
  
    only generate post idea for that social media platform which is true, in format of json (in this structure {facebook:""...})`;
}

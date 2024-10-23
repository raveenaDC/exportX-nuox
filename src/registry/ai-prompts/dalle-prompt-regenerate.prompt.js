export function dallePromptRegeneratePrompt(
  key = '',
  dallePrompt = '',
  language
) {
  if (key !== 'dalle_prompt_regenerate')
    throw new Error('invalid prompt key provided (dalle_prompt_regenerate)');
  return `
dalle prompt: ${dallePrompt}
Use ${language} as response language.`;
}

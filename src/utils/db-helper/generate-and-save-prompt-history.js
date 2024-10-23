import { generateOpenAiText, generateBardText } from '../ai/ai-helper.js';
import { promptModel, promptHistoryModel } from '../../db/models/index.js';
import { formatAiResponse } from '../format-ai-response.helper.js';

async function generateAndSavePromptHistory(
  promptKey = '',
  aiTool = 'openAi',
  params = '',
  language,
  userId = null,
  type = null,
  projectId = null
) {
  const prompt = await promptModel.findOne({ key: promptKey });
  const finalPrompt = `${params}`;
  const aiResponse = await (aiTool === 'openAi'
    ? generateOpenAiText(finalPrompt)
    : language === 'arabic' && type === 'content-idea-regenerate'
      ? generateOpenAiText(finalPrompt)
      : generateBardText(finalPrompt));

  let data, parsedResponse;
  if (
    aiTool !== 'openAi' &&
    type === 'content-idea-regenerate' &&
    language !== 'arabic'
  ) {
    let title, content;
    const regex = /'title'\s*:\s*'([^']+?)'\s*,\s*'content'\s*:\s*'([^']+?)'/g;

    let match;
    while ((match = regex.exec(aiResponse.output)) !== null) {
      title = match[1];
      content = match[2];
    }
    const jsonMatch = aiResponse.output.match(
      /\{"title"\s*:\s*"([^"]+)",\s*"content"\s*:\s*"([^"]+)"\}/
    );
    const noQuotesMatch = aiResponse.output.match(
      /title\s*:\s*([^\n]+)\n\s*content\s*:\s*([^]+)$/m
    );
    const quotesMatch = aiResponse.output.match(
      /"title"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([^"]+)"\s*/
    );

    if (jsonMatch) {
      title = jsonMatch[1];
      content = jsonMatch[2];
    } else if (noQuotesMatch) {
      title = noQuotesMatch[1].trim();
      content = noQuotesMatch[2].trim();
    } else if (quotesMatch) {
      title = quotesMatch[1];
      content = quotesMatch[2];
    }

    if (title && content) {
      data = {
        title: title,
        content: content,
      };
    }
  }
  if (/^```(?:json)?/.test(aiResponse.output)) {
    const jsonString = aiResponse.output.replace(/```(?:json)?\n([\s\S]*?)\n```/, '$1').trim();  
    parsedResponse = JSON.parse(jsonString);
  } else if (aiTool !== 'openAi') {
    if (data && typeof data === 'object') {
      parsedResponse = data;
    } else if (language === 'arabic' && type === 'content-idea-regenerate') {
      parsedResponse = aiResponse;
    } else {
      parsedResponse = aiResponse.output;
    }
  } else {
    parsedResponse = aiResponse;
  }

  if (type !== 'tool-content-idea' || type !== 'post-generate') {
    await promptHistoryModel.create({
      finalPrompt,
      prompt: prompt._id,
      response: JSON.stringify(parsedResponse),
      userId,
      projectId,
    });
  }

  return formatAiResponse(aiTool, parsedResponse);
}

export { generateAndSavePromptHistory };

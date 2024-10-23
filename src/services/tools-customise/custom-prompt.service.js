import httpStatus from 'http-status';
import { responseHelper } from '../../utils/response.helper.js';
import * as models from '../../db/models/index.js';
import { paginateData } from '../../utils/paginate-data.js';
import {
  generateBardText,
  generateOpenAiText,
} from '../../utils/ai/ai-helper.js';
import { getFullProjectDetails } from '../../utils/db-helper/get-full-project-details.helper.js';
import { clientFinetune } from '../../utils/db-helper/client-fine-tune.js';
import { projectBriefData } from '../../utils/db-helper/project-brief-data.js';
import { generateAndSavePromptHistory } from '../../utils/db-helper/generate-and-save-prompt-history.js';

const defaultPageLimit = process.env.PAGE_LIMIT;

export async function GenerateIdeas(req, res, next) {
  try {
    const { parentId } = req.params;
    const { prompt, content } = req.body;
    const { aiTool = 'openAi', language = 'english', projectId } = req.query;
    const userId = req.user.userId;

    let customPrompt;

    const existingPrompt = await models.customPromptModel.findOne({ prompt });
    if (existingPrompt) {
      customPrompt = existingPrompt;
    } else {
      customPrompt = await models.customPromptModel.create({ prompt });
    }

    const dbPrompt = `${customPrompt.prompt}'\n\n'${content}`;
    const apiResponse = await generateOpenAiText(dbPrompt);

    let finalPrompt = dbPrompt;
    let mainPrompt;

    if (projectId) {
      const project = await getFullProjectDetails(projectId);
      let aiResponse;

      try {
        mainPrompt = await models.promptModel.findOne({
          key: 'project_custom_generate',
        });
        const clientDetails = await clientFinetune(
          project.clientBrief,
          language
        );
        const actualValuedbPrompt = await projectBriefData(
          project.projectBrief,
          language,
          clientDetails,
          'project_custom_generate',
          customPrompt.prompt
        );

        aiResponse = await generateAndSavePromptHistory(
          mainPrompt.key,
          aiTool,
          actualValuedbPrompt,
          language,
          userId
        );
        finalPrompt = actualValuedbPrompt;
      } catch (error) {
        return responseHelper(
          res,
          httpStatus.INTERNAL_SERVER_ERROR,
          true,
          'An error occurred while generating content ideas, please try again.'
        );
      }
    }

    const historyData = {
      key: projectId ? 'project_custom_generate' : prompt.key,
      userId: userId,
      response: JSON.stringify(apiResponse),
      finalPrompt: finalPrompt,
      parentId: parentId,
    };

    if (projectId) {
      historyData.prompt = mainPrompt._id;
      historyData.projectId = projectId;
      historyData.language = language;
    } else {
      historyData.customPrompt = customPrompt;
    }

    const childHistory = await models.promptHistoryModel.create(historyData);

    const responseData = {
      finalPrompt: finalPrompt,
      contentIdeas: childHistory.response,
      historyId: childHistory._id,
      title: childHistory.name,
    };

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Generation successful',
      responseData
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function listAll(req, res, next) {
  try {
    let { search } = req.query;

    const query = {};

    if (search) {
      query.$or = [{ name: { $regex: new RegExp(search, 'i') } }];
    }

    const prompts = await models.customPromptModel
      .find(query)
      .sort({ createdAt: -1 });

    const page = parseInt(req.query.page) || 1;
    const paginatedData = paginateData(prompts, page, defaultPageLimit);

    return responseHelper(res, httpStatus.OK, false, 'Custom prompts', {
      prompts: paginatedData.data,
      pagination: paginatedData.pagination,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function createPrompt(req, res, next) {
  try {
    const { prompt, isDefault } = req.body;

    const newPrompt = await models.customPromptModel.create({
      prompt,
      isDefault,
    });
    if (isDefault) {
      await models.customPromptModel.updateMany(
        { _id: { $ne: newPrompt._id } },
        { $set: { isDefault: false } }
      );
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Prompt added successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

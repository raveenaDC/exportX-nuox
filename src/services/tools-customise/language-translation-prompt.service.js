import httpStatus from 'http-status';
import { responseHelper } from '../../utils/response.helper.js';
import * as models from '../../db/models/index.js';
import { paginateData } from '../../utils/paginate-data.js';
import {
  generateOpenAiText,
  generateBardText,
} from '../../utils/ai/ai-helper.js';
import { getFullProjectDetails } from '../../utils/db-helper/get-full-project-details.helper.js';
import { clientFinetune } from '../../utils/db-helper/client-fine-tune.js';
import { projectBriefData } from '../../utils/db-helper/project-brief-data.js';
import { generateAndSavePromptHistory } from '../../utils/db-helper/generate-and-save-prompt-history.js';
const defaultPageLimit = process.env.PAGE_LIMIT;

export async function listAll(req, res, next) {
  try {
    let { search } = req.query;

    const query = {};

    if (search) {
      query.$or = [{ language: { $regex: new RegExp(search, 'i') } }];
    }

    const prompts = await models.langugeTranslationPromptModel
      .find(query)
      .sort({ createdAt: -1 });

    const page = parseInt(req.query.page) || 1;
    const paginatedData = paginateData(prompts, page, defaultPageLimit);

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Language translation prompts',
      { prompts: paginatedData.data, pagination: paginatedData.pagination }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function addPrompt(req, res, next) {
  try {
    const { language, prompt, isDefault } = req.body;
    const existingPrompt = await models.langugeTranslationPromptModel.findOne({
      language: { $regex: new RegExp(`^${language}$`, 'i') },
    });

    if (existingPrompt) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `A prompt for language '${language}' already exists`,
        null
      );
    }

    const newPrompt = await models.langugeTranslationPromptModel.create({
      language,
      prompt,
      isDefault,
    });
    if (isDefault) {
      await models.langugeTranslationPromptModel.updateMany(
        { _id: { $ne: newPrompt._id } },
        { $set: { isDefault: false } }
      );
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Prompt added successfully',
      newPrompt
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function editPrompt(req, res, next) {
  try {
    const { id } = req.params;
    const { language, prompt, isDefault } = req.body;
    const existingPrompt = await models.langugeTranslationPromptModel.findOne({
      language: { $regex: new RegExp(`^${language}$`, 'i') },
      _id: { $ne: id }

    });

    if (existingPrompt) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `A prompt for language '${language}' already exists`,
        null
      );
    }

    const foundPrompt =
      await models.langugeTranslationPromptModel.findByIdAndUpdate(
        id,
        { language, prompt },
        { new: true }
      );

    if (!foundPrompt) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Prompt not found',
        null
      );
    }
    if (isDefault && isDefault === true) {
      foundPrompt.isDefault = true;

      await models.langugeTranslationPromptModel.updateMany(
        { _id: { $ne: id }, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    await foundPrompt.save();

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Prompt updated successfully',
      foundPrompt
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const prompt = await models.langugeTranslationPromptModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!prompt) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Prompt not found',
        null
      );
    }

    let responseMessage = isActive
      ? 'Prompt activated successfully'
      : 'Prompt deactivated successfully';

    return responseHelper(res, httpStatus.OK, false, responseMessage, prompt);
  } catch (error) {
    return next(new Error(error));
  }
}

export async function removePrompt(req, res, next) {
  try {
    const { id } = req.params;

    const foundPrompt =
      await models.langugeTranslationPromptModel.findByIdAndDelete(id);

    if (!foundPrompt) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Prompt not found',
        null
      );
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Prompt removed successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function translateIdeas(req, res, next) {
  try {
    const { content } = req.body;
    const { parentId, promptId } = req.params;
    const { aiTool = 'openAi', language = 'english', projectId } = req.query;
    const userId = req.user.userId;

    const translateLanguagePrompt =
      await models.langugeTranslationPromptModel.findById(promptId);
    if (!translateLanguagePrompt.isActive) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Language is not active'
      );
    }

    const dbPrompt = `${translateLanguagePrompt.prompt}'\n\n'${content}`;
    const apiResponse = await generateOpenAiText(dbPrompt);

    let finalPrompt = dbPrompt;
    let mainPrompt;

    if (projectId) {
      const project = await getFullProjectDetails(projectId);
      let aiResponse;

      try {
        mainPrompt = await models.promptModel.findOne({
          key: 'project_language_translate',
        });
        const clientDetails = await clientFinetune(
          project.clientBrief,
          language
        );
        const actualValuedbPrompt = await projectBriefData(
          project.projectBrief,
          language,
          clientDetails,
          'project_language_translate',
          translateLanguagePrompt.prompt
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
      key: projectId
        ? 'project_language_translate'
        : translateLanguagePrompt.key,
      userId: userId,
      response: JSON.stringify(apiResponse),
      finalPrompt: finalPrompt,
      parentId: parentId,
    };

    if (projectId) {
      historyData.prompt = mainPrompt._id;
      historyData.projectId= projectId
      historyData.language=language
    } else {
      historyData.translatePrompt = promptId;
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
      'Translation completed successfully',
      responseData
    );
  } catch (error) {
    return next(new Error(error));
  }
}

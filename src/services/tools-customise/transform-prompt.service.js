import httpStatus from 'http-status';
import { responseHelper } from '../../utils/response.helper.js';
import * as models from '../../db/models/index.js';
import { paginateData } from '../../utils/paginate-data.js';
import {
  generateBardText,
  generateOpenAiText,
} from '../../utils/ai/ai-helper.js';
import { getFullProjectDetails } from '../../utils/db-helper/get-full-project-details.helper.js';
import { projectBriefData } from '../../utils/db-helper/project-brief-data.js';
import { generateAndSavePromptHistory } from '../../utils/db-helper/generate-and-save-prompt-history.js';
import { clientFinetune } from '../../utils/db-helper/client-fine-tune.js';
const defaultPageLimit = process.env.PAGE_LIMIT;

export async function listAll(req, res, next) {
  try {
    let { search } = req.query;

    const query = {};

    if (search) {
      query.$or = [{ name: { $regex: new RegExp(search, 'i') } }];
    }

    const prompts = await models.transformPromptModel
      .find(query)
      .sort({ createdAt: -1 });

    const page = parseInt(req.query.page) || 1;
    const paginatedData = paginateData(prompts, page, defaultPageLimit);

    return responseHelper(res, httpStatus.OK, false, 'Transform prompts', {
      prompts: paginatedData.data,
      pagination: paginatedData.pagination,
    });
  } catch (error) {
    return next(new Error(error));
  }
}
export async function transformIdeas(req, res, next) {
  try {
    const { promptId, parentId } = req.params;
    const { content } = req.body;
    const { aiTool = 'openAi', language = 'english', projectId } = req.query;
    const userId = req.user.userId;

    const prompt = await models.transformPromptModel.findById(promptId);
    if (!prompt) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Prompt not found.'
      );
    }

    const dbPrompt = `${prompt.prompt}\n\n${content}`;
    const apiResponse = await generateOpenAiText(dbPrompt);

    let finalPrompt = dbPrompt;
    let mainPrompt;

    if (projectId) {
      const project = await getFullProjectDetails(projectId);
      let aiResponse;

      try {
        mainPrompt = await models.promptModel.findOne({
          key: 'project_transform',
        });
        const clientDetails = await clientFinetune(
          project.clientBrief,
          language
        );
        const actualValuedbPrompt = await projectBriefData(
          project.projectBrief,
          language,
          clientDetails,
          'project_transform',
          prompt.prompt
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
      key: projectId ? 'project_transform' : prompt.key,
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
      historyData.transformPrompt = promptId;
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
      'Transformation completed successfully',
      responseData
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function createPrompt(req, res, next) {
  try {
    const { name, prompt, isDefault } = req.body;
    const existingPrompt = await models.transformPromptModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });
    if (existingPrompt) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `A prompt named '${name}' already exists`,
        null
      );
    }

    const newPrompt = await models.transformPromptModel.create({
      name,
      prompt,
      isDefault,
    });
    if (isDefault) {
      await models.transformPromptModel.updateMany(
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
    const { name, prompt, isDefault } = req.body;
    const existingPrompt = await models.transformPromptModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: id },
    });

    if (existingPrompt) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Prompt name already exists',
        null
      );
    }

    const foundPrompt = await models.transformPromptModel.findByIdAndUpdate(
      id,
      { name, prompt },
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

      await models.transformPromptModel.updateMany(
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

    const prompt = await models.transformPromptModel.findByIdAndUpdate(
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

    const foundPrompt = await models.transformPromptModel.findByIdAndDelete(id);

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

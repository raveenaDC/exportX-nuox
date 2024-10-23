import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
import * as models from '../db/models/index.js';

/**
 * @body {String} name
 * @body {String} information
 * @body {String} params
 * @body {String} instruction
 * @returns {Object} prompt
 */
export async function create(req, res, next) {
  try {
    const nameCheck = await models.promptModel.findOne({
      name: req.body.name,
    });

    if (nameCheck) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'prompt name already exists'
      );
    }
    const prompt = await models.promptModel.create(req.body);
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'new prompt created successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @query {String} search
 * @returns {Array} prompts
 */
export async function findAll(req, res, next) {
  try {
    const { search } = req.query;
    const query = !search ? {} : { name: { $regex: new RegExp(search, 'i') } };
    const prompts = await models.promptModel.find(query);
    return responseHelper(res, httpStatus.OK, false, 'all prompts', {
      prompts: prompts,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @params {String} promptId
 * @returns {Object} prompt
 */
export async function findOne(req, res, next) {
  try {
    const { promptId } = req.params;
    const prompt = await models.promptModel.findById(promptId);
    return responseHelper(res, httpStatus.OK, false, 'prompt', {
      prompt: prompt,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @body {String} information
 * @body {String} instruction
 * @params {String} promptId
 * @returns {Object} prompt
 */
export async function update(req, res, next) {
  try {
    const { promptId } = req.params;
    const { information, instruction } = req.body;
    const dbParams = information + instruction;
    const dbKeys = dbParams.match(/[^\[\]]+(?=\])/g);
    const promtKey = await models.promptModel.findById(promptId);
    if (promtKey.key === 'image_ideas_regenerate') {
      if (!dbKeys.includes('imageIdeas')) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          '[imageIdeas] required',
          {}
        );
      }
    } else if (promtKey.key === 'regenerate_single_post') {
      if (
        !dbKeys.includes('post') ||
        !dbKeys.includes('platform') ||
        !dbKeys.includes('content') ||
        !dbKeys.includes('title') ||
        !dbKeys.includes('clientBrief')
      ) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          '[platform] or [post] or [content] or [title] or [clientBrief] are required',
          {}
        );
      }
    } else if (promtKey.key === 'dalle_prompt_regenerate') {
      if (!dbKeys.includes('dallePrompt')) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          '[dallePrompt] required',
          {}
        );
      }
    } else if (promtKey.key === 'generate_tag_ideas') {
      if (
        !dbKeys.includes('description') ||
        !dbKeys.includes('productServiceName')
      ) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          '[description] or [productServiceName] are required',
          {}
        );
      }
    } else if (promtKey.key === 'tool_campaign_idea') {
      if (
        !dbKeys.includes('platform') ||
        !dbKeys.includes('targetAudience') ||
        !dbKeys.includes('toneOfVoice') ||
        !dbKeys.includes('prompt') ||
        !dbKeys.includes('language') ||
        !dbKeys.includes('project')
      ) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          '[platform] or [targetAudience] or [toneOfVoice] or [prompt] or [language] or [project] are required',
          {}
        );
      }
    } else if (promtKey.key === 'tool_creative_idea') {
      if (
        !dbKeys.includes('platform') ||
        !dbKeys.includes('targetAudience') ||
        !dbKeys.includes('toneOfVoice') ||
        !dbKeys.includes('prompt') ||
        !dbKeys.includes('language') ||
        !dbKeys.includes('project')
      ) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          '[platform] or [targetAudience] or [toneOfVoice] or [prompt] or [language] or [project] are required',
          {}
        );
      }
    } else if (promtKey.key === 'tool_email') {
      if (
        !dbKeys.includes('targetAudience') ||
        !dbKeys.includes('toneOfVoice') ||
        !dbKeys.includes('subject') ||
        !dbKeys.includes('language')
      ) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          ' [targetAudience] or [toneOfVoice] or [subject] or [language]  are required',
          {}
        );
      }
    } else if (promtKey.key === 'content_idea_regenerate') {
      if (!dbKeys.includes('title') || !dbKeys.includes('content')) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          ' [title] or [content]  are required',
          {}
        );
      }
    } else if (promtKey.key === 'generate_more_content_ideas') {
      if (!dbKeys.includes('selectedIdeas')) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          '[selectedIdeas] is required',
          {}
        );
      }
    } else if (promtKey.key === 'image_ideas_and_dalle_prompt_generator') {
      if (!dbKeys.includes('postIdeasString')) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          '[postIdeasString] is required',
          {}
        );
      }
    } else if (promtKey.key === 'generate_posts') {
      if (
        !dbKeys.includes('content') ||
        !dbKeys.includes('settings') ||
        !dbKeys.includes('title')
      ) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          '[content] or [title] or [settings] are required',
          {}
        );
      }
    } else if (promtKey.key === 'generate_single_post') {
      if (!dbKeys.includes('title') || !dbKeys.includes('content')) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          '[content] or [title] are required',
          {}
        );
      }
    } else if (promtKey.key === 'post_ideas_and_dalle_prompt_generator') {
      if (!dbKeys.includes('postIdeas')) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          '[postIdeas] is required',
          {}
        );
      }
    }
    const prompt = await models.promptModel.findByIdAndUpdate(
      promptId,
      req.body,
      { new: true }
    );
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'prompt updated successfully',
      { prompt: prompt }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @params {String} promptId
 * @returns {Null}
 */
export async function remove(req, res, next) {
  try {
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'prompts deleted successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @query {String} search
 * @returns {Array} promptsHistory
 */
export async function findAllPromptHistory(req, res, next) {
  try {
    const { search } = req.query;
    const query = !search
      ? {}
      : {
          $or: [
            { finalPrompt: { $regex: new RegExp(search, 'i') } },
            { name: { $regex: new RegExp(search, 'i') } },
          ],
        };
    const filter = new Date();
    filter.setMonth(filter.getMonth() - 3);

    const promptHistory = await models.promptHistoryModel
      .find({
        ...query,
        createdAt: { $gte: filter },
      })
      .populate([
        { path: 'prompt customPrompt translatePrompt transformPrompt' },
      ]);

    return responseHelper(res, httpStatus.OK, false, 'prompt history', {
      promptHistory: promptHistory,
    });
  } catch (error) {
    return next(new Error(error));
  }
}
export async function findPromptHistory(req, res, next) {
  try {
    const { id } = req.params;
    const promptHistory = await models.promptHistoryModel
      .findById(id)
      .populate({ path: 'prompt' })
      .populate({ path: 'customPrompt' })
      .populate({ path: 'transformPrompt' })
      .populate({ path: 'translatePrompt' });

    return responseHelper(res, httpStatus.OK, false, 'prompt history', {
      promptHistory: promptHistory,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

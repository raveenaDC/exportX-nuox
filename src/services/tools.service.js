import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
import * as models from '../db/models/index.js';
import { emailContentRegeneratePrompt } from '../registry/ai-prompts/email-content.prompt.js';
import { contentRegeneratePrompt } from '../registry/ai-prompts/tools-campaign-idea.prompt.js';
import { creativeIdeaRegeneratePrompt } from '../registry/ai-prompts/tools-creative-idea.prompt.js';
import { generateOpenAiText, generateBardText } from '../utils/ai/ai-helper.js';
import { adjustWordCount } from '../utils/db-helper/approximate-word-count.helper.js';
import path from 'path';
import { paginateData } from '../utils/paginate-data.js';
import { generateImage } from '../utils/ai/ai-helper.js';
import * as cheerio from 'cheerio';
import { clientFinetune } from '../utils/db-helper/client-fine-tune.js';
const defaultPageLimit = process.env.PAGE_LIMIT;

export async function generateCreativeIdea(req, res, next) {
  try {
    const {
      project,
      language,
      platform,
      tool,
      prompt,
      toneOfVoice,
      targetAudience,
      approximateWords,
      hashTag,
    } = req.body;
    let words = approximateWords || 100;
    if (
      !(
        language.toLowerCase() === 'english' ||
        language.toLowerCase() === 'arabic'
      )
    ) {
      return responseHelper(
        res,
        httpStatus.NOT_ACCEPTABLE,
        true,
        'Language should be English or Arabic'
      );
    }
    const projects = await models.projectModel.findById(project).populate({
      path: 'clientId',
      select: 'brandDescription brandName brandUrl',
    });
    if (!projects) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const tone = await models.toneOfVoiceModel.findById(toneOfVoice);
    if (!tone) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Tone of voice not exists'
      );
    }
    let apiResponse;
    const prompts = await models.promptModel.findOne({
      key: 'tool_creative_idea',
    });
    let brandInfo = await models.clientBrandInfoModel.find({
      clientId: project.clientId,
    });
    const clientDetails = await clientFinetune(brandInfo[0], language);
    const dbPrompt = prompts.information + '\n\n' + prompts.instruction;
    const dataSet = {
      project: projects.name,
      type: projects.type,
      description: projects.description,
      pillars: project.pillars,
        observationDays: project.observationDays,
      language: language,
      prompt: prompt,
      toneOfVoice: tone.toneOfVoice,
      targetAudience: targetAudience,
      hashTag: hashTag ? hashTag : 'false',
      approximateWords: words,
      platform: platform,
      clientBrief:clientDetails
    };

    const dbKeys = dbPrompt.match(/[^\[\]]+(?=\])/g);
    for (const key in dataSet) {
      // Check if the key exists in dbKeys
      if (!dbKeys.includes(key)) {
        // Remove the key-value pair from the dataSet
        delete dataSet[key];
      }
    }
    let actualValuedbPrompt = dbPrompt;
    for (const key in dataSet) {
      if (dataSet[key] !== undefined && dataSet[key] !== null) {
        const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
        actualValuedbPrompt = actualValuedbPrompt.replace(regex, dataSet[key]); // Replace the placeholder with the actual value
      } else {
        const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
        actualValuedbPrompt = actualValuedbPrompt.replace(regex, ''); // Remove the placeholder
      }
    }

    const params = creativeIdeaRegeneratePrompt(
      prompts?.key,
      tone.toneOfVoice,
      hashTag
    );

    const final = `${actualValuedbPrompt} \n ${params}`;
    const finalPrompt = final;
    let output;
    if (tool !== 'openAi' && language === 'english') {
      apiResponse = await generateBardText(finalPrompt);
      output = apiResponse.output;
    } else {
      apiResponse = await generateOpenAiText(finalPrompt);
      output = apiResponse;
    }
    const promptHistory = await models.promptHistoryModel.create({
      key: prompts.key,
      userId: req.user.userId,
      response: JSON.stringify(apiResponse),
      finalPrompt: finalPrompt,
      prompt: prompts._id,
      input: JSON.stringify(req.body),
    });
    promptHistory.parentId = promptHistory._id;
    await promptHistory.save();
    let trimmedResponses = await adjustWordCount(output, words, hashTag);
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Creative idea generated successfully',
      {
        finalPrompt,
        historyId: promptHistory.parentId,
        title: promptHistory.name,
        contentIdeas: trimmedResponses,
      }
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function generateCampaignIdea(req, res, next) {
  try {
    const {
      project,
      language,
      platform,
      tool,
      prompt,
      toneOfVoice,
      targetAudience,
      approximateWords,
      hashTag,
    } = req.body;

    let words = approximateWords || 100;
    if (
      !(
        language.toLowerCase() === 'english' ||
        language.toLowerCase() === 'arabic'
      )
    ) {
      return responseHelper(
        res,
        httpStatus.NOT_ACCEPTABLE,
        true,
        'Language should be English or Arabic'
      );
    }
    const projects = await models.projectModel.findById(project).populate({
      path: 'clientId',
      select: 'brandDescription brandName brandUrl',
    });
    if (!projects) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const tone = await models.toneOfVoiceModel.findById(toneOfVoice);
    if (!tone) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Tone of voice not exists'
      );
    }
    let apiResponse;
    const prompts = await models.promptModel.findOne({
      key: 'tool_campaign_idea',
    });
    let brandInfo = await models.clientBrandInfoModel.find({
      clientId: project.clientId,
    });
    const clientDetails = await clientFinetune(brandInfo[0], language);
    const dbPrompt = prompts.information + '\n\n' + prompts.instruction;
    const dataSet = {
      project: projects.name,
      type: projects.type,
      description: projects.description,
      pillars: project.pillars,
      observationDays: project.observationDays,
      language: language,
      prompt: prompt,
      toneOfVoice: tone.toneOfVoice,
      targetAudience: targetAudience,
      hashTag: hashTag ? hashTag : 'false',
      approximateWords: words,
      platform: platform,
      clientBrief:clientDetails
    };

    const dbKeys = dbPrompt.match(/[^\[\]]+(?=\])/g);
    for (const key in dataSet) {
      // Check if the key exists in dbKeys
      if (!dbKeys.includes(key)) {
        // Remove the key-value pair from the dataSet
        delete dataSet[key];
      }
    }
    let actualValuedbPrompt = dbPrompt;
    for (const key in dataSet) {
      if (dataSet[key] !== undefined && dataSet[key] !== null) {
        const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
        actualValuedbPrompt = actualValuedbPrompt.replace(regex, dataSet[key]); // Replace the placeholder with the actual value
      } else {
        const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
        actualValuedbPrompt = actualValuedbPrompt.replace(regex, ''); // Remove the placeholder
      }
    }

    const params = contentRegeneratePrompt(
      prompts?.key,
      tone.toneOfVoice,
      hashTag
    );

    const final = `${actualValuedbPrompt} \n ${params}`;
    const finalPrompt = final;
    let output;
    if (tool !== 'openAi' && language === 'english') {
      apiResponse = await generateBardText(finalPrompt);
      output = apiResponse.output;
    } else {
      apiResponse = await generateOpenAiText(finalPrompt);
      output = apiResponse;
    }

    const promptHistory = await models.promptHistoryModel.create({
      key: prompts.key,
      userId: req.user.userId,
      response: JSON.stringify(apiResponse),
      finalPrompt: finalPrompt,
      prompt: prompts._id,
      input: JSON.stringify(req.body),
    });
    promptHistory.parentId = promptHistory._id;
    await promptHistory.save();

    let trimmedResponses = await adjustWordCount(output, words, hashTag);

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Campagin idea generated successfully',
      {
        finalPrompt,
        historyId: promptHistory.parentId,
        title: promptHistory.name,
        contentIdeas: trimmedResponses,
      }
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function generateEmailContent(req, res, next) {
  try {
    const { language, subject, keyPoints, toneOfVoice, targetAudience } =
      req.body;
    if (
      !(
        language.toLowerCase() === 'english' ||
        language.toLowerCase() === 'arabic'
      )
    ) {
      return responseHelper(
        res,
        httpStatus.NOT_ACCEPTABLE,
        true,
        'Language should be English or Arabic'
      );
    }
    const tone = await models.toneOfVoiceModel.findById(toneOfVoice);
    if (!tone) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Tone of voice not exists'
      );
    }

    const prompts = await models.promptModel.findOne({ key: 'tool_email' });

    const dbPrompt = prompts.information + '\n\n' + prompts.instruction;
    const dataSet = {
      language: language,
      subject: subject,
      toneOfVoice: tone.toneOfVoice,
      targetAudience: targetAudience,
      keyPoints: keyPoints,
    };

    const dbKeys = dbPrompt.match(/[^\[\]]+(?=\])/g);
    for (const key in dataSet) {
      // Check if the key exists in dbKeys
      if (!dbKeys.includes(key)) {
        // Remove the key-value pair from the dataSet
        delete dataSet[key];
      }
    }
    let actualValuedbPrompt = dbPrompt;
    for (const key in dataSet) {
      if (dataSet[key] !== undefined && dataSet[key] !== null) {
        const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
        actualValuedbPrompt = actualValuedbPrompt.replace(regex, dataSet[key]); // Replace the placeholder with the actual value
      } else {
        const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
        actualValuedbPrompt = actualValuedbPrompt.replace(regex, ''); // Remove the placeholder
      }
    }

    const params = emailContentRegeneratePrompt(
      prompts?.key,
      subject,
      targetAudience
    );
    const final = `${actualValuedbPrompt} \n ${params}`;
    // const finalPrompt = final.replace(/\n/g, '<br>');
    const apiResponse = await generateOpenAiText(final);
    const email = await models.promptHistoryModel.create({
      key: prompts.key,
      finalPrompt: final,
      prompt: prompts._id,
      userId: req.user.userId,
      response: JSON.stringify(apiResponse),
      input: JSON.stringify(req.body),
    });
    email.parentId = email._id;
    await email.save();
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Email draft generated successfully',
      {
        finalPrompt: final,
        historyId: email._id,
        title: email.name,
        emailDraft: apiResponse,
      }
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function saveCampaignIdea(req, res, next) {
  try {
    // let addPrompt = await models.promptHistoryModel
    //   .findOne({ key: 'tool_campaign_idea', userId: req.user.userId })
    //   .sort({ createdAt: -1 })
    //   .exec();

    // let existance = await models.toolGeneratedIdeas.findOne({
    //   savedPromptHistory: addPrompt._id,
    // });
    // if (existance)
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'Already added',
    //     {}
    //   );

    const {
      language,
      platform,
      aiTool,
      prompt,
      approximateWords,
      hashTag,
      toneOfVoice,
      targetAudience,
      output,
      project,
      historyId,
      title,
    } = req.body;

    await models.toolGeneratedIdeas.create({
      language,
      platform,
      aiTool,
      prompt,
      approximateWord: approximateWords,
      hashTag,
      toneOfVoice,
      targetAudience,
      response: output,
      projectId: project,
      key: 'tool_campaign_idea',
      userId: req.user.userId,
      savedPromptHistory: historyId,
      name: title,
    });
    await models.promptHistoryModel.findByIdAndUpdate(
      historyId,
      { $set: { isSaved: true, response: output } },
      { new: true }
    );

    const $ = cheerio.load(output);

    const heading = $('h3').text();
    const paragraphs = $('p')
      .map((_, element) => $(element).text())
      .get();

    const plan = {
      title: heading,
      content: paragraphs.join('\n'),
      isTool: true,
    };

    const planner = await models.socialMediaPlannerModel.create(plan);
    await models.projectModel.findByIdAndUpdate(project, {
      $push: {
        'contentPlanner.socialMediaPlanner': {
          language: language.toLowerCase(),
          plan: planner._id,
        },
      },
    });
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Campaign idea is saved successfully.',
      {}
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function saveCreativeIdea(req, res, next) {
  try {
    // let addPrompt = await models.promptHistoryModel
    //   .findOne({ key: 'tool_creative_idea', userId: req.user.userId })
    //   .sort({ createdAt: -1 })
    //   .exec();

    // let existance = await models.toolGeneratedIdeas.findOne({
    //   savedPromptHistory: addPrompt._id,
    // });
    // if (existance)
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'Already added',
    //     {}
    //   );
    const {
      language,
      platform,
      aiTool,
      prompt,
      approximateWords,
      hashTag,
      toneOfVoice,
      targetAudience,
      output,
      project,
      historyId,
      title,
    } = req.body;

    await models.toolGeneratedIdeas.create({
      language,
      platform,
      aiTool,
      prompt,
      approximateWord: approximateWords,
      hashTag,
      toneOfVoice,
      targetAudience,
      response: output,
      projectId: project,
      key: 'tool_creative_idea',
      userId: req.user.userId,
      savedPromptHistory: historyId,
      name: title,
    });
    await models.promptHistoryModel.findByIdAndUpdate(
      historyId,
      { $set: { isSaved: true, response: output } },
      { new: true }
    );

    const $ = cheerio.load(output);

    const heading = $('h3').text();
    const paragraphs = $('p')
      .map((_, element) => $(element).text())
      .get();

    const plan = {
      title: heading,
      content: paragraphs.join('\n'),
      isTool: true,
    };

    const planner = await models.socialMediaPlannerModel.create(plan);
    await models.projectModel.findByIdAndUpdate(project, {
      $push: {
        'contentPlanner.socialMediaPlanner': {
          language: language.toLowerCase(),
          plan: planner._id,
        },
      },
    });

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Creative idea is saved',
      {}
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function saveEmailContent(req, res, next) {
  try {
    // let addPrompt = await models.promptHistoryModel
    //   .findOne({ key: 'tool_email', userId: req.user.userId })
    //   .sort({ createdAt: -1 })
    //   .exec();

    // let existance = await models.toolSavedEmailModel.findOne({
    //   savedPromptHistory: addPrompt._id,
    // });
    // if (existance)
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'Already added',
    //     {}
    //   );

    const {
      language,
      subject,
      keyPoints,
      toneOfVoice,
      targetAudience,
      output,
      historyId,
      title,
    } = req.body;

    await models.toolSavedEmailModel.create({
      language: language,
      subject: subject,
      keyPoints: keyPoints,
      toneOfVoice: toneOfVoice,
      targetAudience: targetAudience,
      response: output,
      key: 'tool_email',
      userId: req.user.userId,
      savedPromptHistory: historyId,
      name: title,
    });
    await models.promptHistoryModel.findByIdAndUpdate(
      historyId,
      { $set: { isSaved: true, response: output } },
      { new: true }
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Email draft is saved',
      {}
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function getAllSavedCampaignIdea(req, res, next) {
  try {
    // const results = [];
    let draft = await models.toolGeneratedIdeas
      .find({
        userId: req.user.userId,
        key: 'tool_campaign_idea',
      })
      .select(
        'projectId userId key platform prompt language aiTool targetAudience approximateWord hashTag toneOfVoice response'
      )
      .populate({
        path: 'toneOfVoice',
        select: 'toneOfVoice',
      })
      .populate({
        path: 'projectId',
        select: 'name description type startDate endDate',
      })
      .populate({
        path: 'userId',
        select: 'firstName lastName userImage',
      });
    if (!draft) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'No contents found'
      );
    }

    return responseHelper(res, httpStatus.OK, false, '', {
      campaignIdea: draft,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function getAllSavedPrompt(req, res, next) {
  try {
    let { search, period, page = 1, pageLimit = defaultPageLimit } = req.query;
    const emails = await models.toolSavedEmailModel.find({
      userId: req.user.userId,
    });
    const ideas = await models.toolGeneratedIdeas.find({
      userId: req.user.userId,
    });

    const emailData = emails.map((email) => ({
      title: email.name ? email.name : '',
      key: email.key,
      createdDate: email.createdAt.toISOString().split('T')[0],
      _id: email._id,
      historyId: email.savedPromptHistory,
    }));

    const ideaData = ideas.map((idea) => ({
      title: idea.name ? idea.name : '',
      key: idea.key,
      createdDate: idea.createdAt.toISOString().split('T')[0],
      _id: idea._id,
      historyId: idea.savedPromptHistory,
    }));
    let combinedData = [...emailData, ...ideaData];
    const currentDate = new Date();

    if (period) {
      let startDate, endDate;

      switch (period) {
        case 'thisMonth':
          startDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
          );
          endDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
          );
          break;
        case 'thisWeek':
          const firstDayOfWeek = new Date(currentDate);
          firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          const lastDayOfWeek = new Date(currentDate);
          lastDayOfWeek.setDate(
            currentDate.getDate() - currentDate.getDay() + 6
          );
          startDate = firstDayOfWeek;
          endDate = lastDayOfWeek;
          break;
        default:
          break;
      }

      if (startDate && endDate) {
        combinedData = combinedData.filter((item) => {
          const itemDate = new Date(item.createdDate);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }
    } else if (search) {
      const regex = new RegExp(search, 'i');
      combinedData = combinedData.filter(
        (item) => regex.test(item.title) || regex.test(item.key)
      );
    } else {
      combinedData.sort(
        (a, b) => new Date(b.createdDate) - new Date(a.createdDate)
      );
    }
    page = parseInt(page);
    pageLimit = parseInt(pageLimit);
    const paginatedData = paginateData(combinedData, page, pageLimit);

    return responseHelper(res, httpStatus.OK, false, '', {
      savedPrompt: paginatedData.data,
      pagination: paginatedData.pagination,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function getSavedParentChildList(req, res, next) {
  try {
    const { historyId } = req.params;
    let savedHistory;
    const email = await models.toolSavedEmailModel
      .findOne({
        userId: req.user.userId,
        savedPromptHistory: historyId,
      })
      .populate({ path: 'toneOfVoice', select: 'toneOfVoice _id' });

    if (email) {
      const history = await models.promptHistoryModel.findOne({
        _id: historyId,
      });

      let response = [];
      if (history && history.parentId) {
        let historyPrompts = await models.promptHistoryModel.find({
          parentId: history.parentId,
          isSaved: true,
        });
        historyPrompts.forEach((ids) => {
          response.push({
            historyId: ids._id, // Assuming ids._id is the correct historyId
            title: ids.name ? ids.name : '',
            key: ids.key,
            createdDate: ids.createdAt.toISOString().split('T')[0],
            content: ids.response,
          });
        });
      }

      savedHistory = {
        language: email.language || '',
        subject: email.subject || '',
        toneOfVoice: email.toneOfVoice || '',
        keyPoints: email.keyPoints || '',
        targetAudience: email.targetAudience || '',
        createdDate: email.createdAt
          ? email.createdAt.toISOString().split('T')[0]
          : '',
        id: email._id,
        ideas: response,
      };
    } else {
      const ideas = await models.toolGeneratedIdeas
        .findOne({
          userId: req.user.userId,
          savedPromptHistory: historyId,
        })
        .populate({ path: 'toneOfVoice', select: 'toneOfVoice _id' })
        .populate({ path: 'projectId', select: 'name _id' });
      if (ideas) {
        const history = await models.promptHistoryModel.findOne({
          _id: historyId,
        });

        let response = [];
        if (history && history.parentId) {
          let historyPrompts = await models.promptHistoryModel.find({
            parentId: history.parentId,
            isSaved: true,
          });
          historyPrompts.forEach((ids) => {
            response.push({
              historyId: ids._id, // Assuming ids._id is the correct historyId
              title: ids.name ? ids.name : '',
              key: ids.key,
              createdDate: ids.createdAt.toISOString().split('T')[0],
              content: ids.response,
            });
          });
        }

        savedHistory = {
          language: ideas.language || '',
          project: ideas.projectId || '',
          aiTool: ideas.aiTool || '',
          toneOfVoice: ideas.toneOfVoice || '',
          platform: ideas.platform || '',
          targetAudience: ideas.targetAudience || '',
          approximateWord: ideas.approximateWord || '',
          hashTag: ideas.hashTag || '',
          createdDate: ideas.createdAt
            ? ideas.createdAt.toISOString().split('T')[0]
            : '',
          id: ideas._id,
          ideas: response,
        };
      }
    }
    if (!savedHistory) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Content not found',
        {}
      );
    }
    // const combinedData = [...emailData, ...ideaData];
    return responseHelper(res, httpStatus.OK, false, '', {
      savedPrompt: savedHistory,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function findOneCampaignIdea(req, res, next) {
  try {
    let draft = await models.toolGeneratedIdeas
      .findById(req.params.id)
      .select(
        'projectId userId key platform prompt language aiTool targetAudience approximateWord hashTag toneOfVoice response'
      )
      .populate({
        path: 'toneOfVoice',
        select: 'toneOfVoice',
      })
      .populate({
        path: 'projectId',
        select: 'name description type startDate endDate',
      })
      .populate({
        path: 'userId',
        select: 'firstName lastName userImage',
      });
    if (!draft) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Content not found'
      );
    }
    return responseHelper(res, httpStatus.OK, false, '', {
      campaignIdea: draft,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function getAllSavedCreativeIdea(req, res, next) {
  try {
    // const results = [];
    let draft = await models.toolGeneratedIdeas
      .find({
        userId: req.user.userId,
        key: 'tool_creative_idea',
      })
      .select(
        'projectId userId key platform prompt language aiTool targetAudience approximateWord hashTag toneOfVoice response'
      )
      .populate({
        path: 'toneOfVoice',
        select: 'toneOfVoice',
      })
      .populate({
        path: 'projectId',
        select: 'name description type startDate endDate',
      })
      .populate({
        path: 'userId',
        select: 'firstName lastName userImage',
      });
    if (!draft) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'No contents found'
      );
    }

    return responseHelper(res, httpStatus.OK, false, '', {
      creativeIdeas: draft,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function findOneCreativeIdea(req, res, next) {
  try {
    let draft = await models.toolGeneratedIdeas
      .findById(req.params.id)
      .select(
        'projectId userId key platform prompt language aiTool targetAudience approximateWord hashTag toneOfVoice response'
      )
      .populate({
        path: 'toneOfVoice',
        select: 'toneOfVoice',
      })
      .populate({
        path: 'projectId',
        select: 'name description type startDate endDate',
      })
      .populate({
        path: 'userId',
        select: 'firstName lastName userImage',
      });
    if (!draft) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Content not found'
      );
    }
    return responseHelper(res, httpStatus.OK, false, '', {
      creativeIdeas: draft,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function getAllSavedEmail(req, res, next) {
  try {
    let draft = await models.toolSavedEmailModel
      .find({
        userId: req.user.userId,
        key: 'tool_email',
      })
      .select(
        ' userId key language subject keyPoints targetAudience  toneOfVoice response'
      )
      .populate({
        path: 'toneOfVoice',
        select: 'toneOfVoice',
      })
      .populate({
        path: 'userId',
        select: 'firstName lastName userImage',
      });
    if (!draft) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Emails not found'
      );
    }
    return responseHelper(res, httpStatus.OK, false, '', { emailDraft: draft });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function findOneEmail(req, res, next) {
  try {
    let draft = await models.toolSavedEmailModel
      .findById(req.params.id)
      .select(
        ' userId key language subject keyPoints targetAudience  toneOfVoice response'
      )
      .populate({
        path: 'toneOfVoice',
        select: 'toneOfVoice',
      })
      .populate({
        path: 'userId',
        select: 'firstName lastName userImage',
      });
    if (!draft) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'Email not found');
    }
    return responseHelper(res, httpStatus.OK, false, '', { emailDraft: draft });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function generatePosterImage(req, res, next) {
  try {
    const { dallePrompt } = req.body;
    const { userId } = req.user;

    const imageGenerationResponse = await generateImage(dallePrompt);
    const finalResponse =
      imageGenerationResponse.data && imageGenerationResponse.data.length > 0
        ? `${imageGenerationResponse.data[0].revised_prompt} /n/n image=> ${imageGenerationResponse.data[0].url}`
        : 'image generation error';
    //save history
    await models.promptHistoryModel.create({
      finalPrompt: dallePrompt,
      response: finalResponse,
      userId,
    });

    return responseHelper(
      res,
      httpStatus.CREATED,
      true,
      'image generated successfully',
      { imageUrl: imageGenerationResponse.data[0].url }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

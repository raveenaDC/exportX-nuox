import httpStatus from 'http-status';
import { unlinkSync } from 'fs';
import path from 'path';
import { getFullProjectDetails } from '../../utils/db-helper/get-full-project-details.helper.js';
import { responseHelper } from '../../utils/response.helper.js';
import * as models from '../../db/models/index.js';
import { generateAndSavePromptHistory } from '../../utils/db-helper/generate-and-save-prompt-history.js';
import { clientFinetune } from '../../utils/db-helper/client-fine-tune.js';
import { designFinetune } from '../../utils/db-helper/design-fine-tune.js';
import { projectBriefData } from '../../utils/db-helper/project-brief-data.js';
import { generateImage } from '../../utils/ai/ai-helper.js';
import {
  getClientName,
  getUserName,
  getClientUserName,
  sendNotificationsForRole,
} from '../../utils/db-helper/notification-creator.helper.js';
import { imageGenerationParamsPrompt } from '../../registry/ai-prompts/image-generation-params-prompt.js';
import { downloadAndSaveImage } from '../../utils/download-and-save-image.js';
import { getCurrentWorkingFolder } from '../../utils/get-current-working-folder.helper.js';

const formatContentIdeas = (ideas = []) => {
  return ideas.map((idea) => ({
    title: idea.title,
    content: idea.content,
    selected: false,
  }));
};
const listedContentIdeas = (ideas = []) => {
  return ideas
    .map((idea, index) => {
      return `${index + 1}. ${idea.title} :\n    ${idea.content}`;
    })
    .join('\n');
};
export async function listedsettings(obj) {
  let result = '';
  let index = 1;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (obj[key] === true) {
        result += `${key},\t`;
        index++;
      }
    }
  }
  return result;
}

export async function getSettings(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await getFullProjectDetails(projectId);
    const settings = project?.contentPlanner?.settings;

    return responseHelper(res, httpStatus.OK, false, 'settings.', {
      settings: settings,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function saveSettings(req, res, next) {
  try {
    const { projectId } = req.params;
    const {
      settings: { languages, platforms, aiTool },
    } = req.body;

    const project = await models.projectModel.findOneAndUpdate(
      { _id: projectId },
      {
        $set: {
          'contentPlanner.settings.languages': languages,
          'contentPlanner.settings.platforms': platforms,
          'contentPlanner.settings.aiTool': aiTool,
        },
      },
      { new: true }
    );

    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'settings saved successfully.'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getFeedAiDetails(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await models.projectModel.findById(projectId);

    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    if (JSON.stringify(project.clientBrief) === '{}') {
      const client = await models.clientModel.findById(project.clientId);
      project.clientBrief = client?.clientBrief;
    }

    const projectBrief = project?.projectBrief;
    const clientBrief = project?.clientBrief;
    const tagIdeas = project?.tagIdeas;
    const designBrief = project?.designBrief;

    return responseHelper(res, httpStatus.OK, false, 'feed ai details.', {
      projectBrief: projectBrief,
      clientBrief: clientBrief,
      tagIdeas: tagIdeas,
      designBrief: designBrief,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function saveFeedAiDetails(req, res, next) {
  try {
    const { projectId } = req.params;
    const { projectBrief, clientBrief, tagIdeas, designBrief } = req.body;
    const project = await models.projectModel.findOneAndUpdate(
      { _id: projectId },
      {
        $set: {
          projectBrief: projectBrief,
          clientBrief: clientBrief,
          tagIdeas: tagIdeas,
          designBrief: designBrief,
        },
      },
      { new: true }
    );

    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'feed ai details saved successfully.'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function generateContentIdeas(req, res, next) {
  try {
    const { projectId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { userId } = req.user;

    const project = await getFullProjectDetails(projectId);

    let aiResponse, finalPrompt;
    try {
      const prompts = await models.promptModel.findOne({
        key: 'content_ideas',
      });
      const clientDetails = await clientFinetune(project.clientBrief, language);
      const actualValuedbPrompt = await projectBriefData(
        project.projectBrief,
        language,
        clientDetails,
        'content_ideas'
      );

      aiResponse = await generateAndSavePromptHistory(
        prompts?.key,
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

    const formattedContentIdeas = formatContentIdeas(aiResponse);
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'content ideas generated successfully.',
      { finalPrompt, contentIdeas: formattedContentIdeas }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function generateToolContentIdeas(req, res, next) {
  try {
    const { projectId } = req.params;
    const { aiTool = 'openAi', language = 'english', projectType } = req.query;
    const { userId } = req.user;

    const project = await getFullProjectDetails(projectId);

    let aiResponse, prompts, actualValuedbPrompt;
    let savedHistory = [];
    try {
      if (projectType === 'social_media_post_generator') {
        prompts = await models.promptModel.findOne({
          key: 'project_social_media_post_generator',
        });
      } else if (projectType === 'content_idea_generator') {
        prompts = await models.promptModel.findOne({
          key: 'project_content_idea_generator',
        });
      } else if (projectType === 'campaign_ideas') {
        prompts = await models.promptModel.findOne({
          key: 'project_campaign_idea_generator',
        });
      }

      let brandInfo = await models.clientBrandInfoModel.find({
        clientId: project.clientId,
      });
      const clientDetails = await clientFinetune(brandInfo[0], language);

      const dbPrompt = prompts.information + '\n\n' + prompts.instruction;
      const dataSet = {
        adGoal: project?.projectBrief?.adGoals?.adGoal,
        toneOfVoice: project?.projectBrief?.toneOfVoice?.toneOfVoice,
        targetAudience: project?.projectBrief?.targetAudience,
        productServiceName: project?.projectBrief?.productServiceName,
        briefDescription: project?.projectBrief?.briefDescription,
        pillars: project?.projectBrief?.pillars,
        observationDays: project?.projectBrief?.observationDays,
        language: language,
        clientBrief: clientDetails,
      };

      const dbKeys = dbPrompt.match(/[^\[\]]+(?=\])/g);
      for (const key in dataSet) {
        if (!dbKeys.includes(key)) {
          delete dataSet[key];
        }
      }
      actualValuedbPrompt = dbPrompt;
      for (const key in dataSet) {
        if (dataSet[key] !== undefined && dataSet[key] !== null) {
          const regex = new RegExp('\\[' + key + '\\]', 'g');
          actualValuedbPrompt = actualValuedbPrompt.replace(
            regex,
            dataSet[key]
          );
        } else {
          const regex = new RegExp('\\[' + key + '\\]', 'g');
          actualValuedbPrompt = actualValuedbPrompt.replace(regex, '');
        }
      }

      aiResponse = await generateAndSavePromptHistory(
        prompts?.key,
        aiTool,
        actualValuedbPrompt,
        language,
        userId,
        'tool-content-idea'
      );

      const responseStrings = aiResponse.map((obj) => JSON.stringify(obj));

      for (const [index, responseString] of responseStrings.entries()) {
        const savedEntry = await models.promptHistoryModel.create({
          finalPrompt: actualValuedbPrompt,
          prompt: prompts._id,
          response: responseString,
          userId,
          projectId,
          key: projectType !== 'social_media_post_generator' ? projectType : '',
        });

        savedHistory.push({
          title: aiResponse[index].title,
          content: aiResponse[index].content,
          historyId: savedEntry._id,
          selected: false,
        });
      }
    } catch (error) {
      return responseHelper(
        res,
        httpStatus.INTERNAL_SERVER_ERROR,
        true,
        'An error occurred while generating content ideas, please try again.'
      );
    }

    const formattedContentIdeas = formatContentIdeas(aiResponse);
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'content ideas generated successfully.',
      { finalPrompt: actualValuedbPrompt, contentIdeas: savedHistory }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function saveIndividualContentIdeas(req, res, next) {
  try {
    const { projectId, historyId, language } = req.params;
    const { content, title } = req.body;

    // Validate request data
    if (!projectId || !historyId || !content || !title || !language) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Invalid request data',
        {}
      );
    }

    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found',
        {}
      );
    }

    const history = await models.promptHistoryModel.findById(historyId);
    if (!history) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Content not found',
        {}
      );
    }

    // Update the history record
    history.isSaved = true;
    history.language = language;
    history.response = JSON.stringify({ title, content });

    await history.save();

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Content idea saved successfully.',
      {}
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function generateMoreContentIdeas(req, res, next) {
  try {
    const { projectId } = req.params;
    const { aiTool = 'openAi', language = 'english', projectType } = req.query;
    const { userId } = req.user;
    const { contentIdeas } = req.body;

    const project = await getFullProjectDetails(projectId);

    let aiResponse, finalPrompt;
    let savedHistory = [];
    try {
      const prompts = await models.promptModel.findOne({
        key: 'generate_more_content_ideas',
      });

      let brandInfo = await models.clientBrandInfoModel.find({
        clientId: project.clientId,
      });
      const listedContentIdea = listedContentIdeas(contentIdeas);
      const dbPrompt = prompts.information + '\n\n' + prompts.instruction;
      const clientDetails = await clientFinetune(brandInfo[0], language);
      const dataSet = {
        adGoal: project?.projectBrief?.adGoals?.adGoal,
        toneOfVoice: project?.projectBrief?.toneOfVoice?.toneOfVoice,
        targetAudience: project?.projectBrief?.targetAudience,
        productServiceName: project?.projectBrief?.productServiceName,
        briefDescription: project?.projectBrief?.briefDescription,
        pillars: project?.projectBrief?.pillars,
        observationDays: project?.projectBrief?.observationDays,
        language: language,
        selectedIdeas: listedContentIdea,
        clientBrief: clientDetails,
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
          actualValuedbPrompt = actualValuedbPrompt.replace(
            regex,
            dataSet[key]
          ); // Replace the placeholder with the actual value
        } else {
          const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
          actualValuedbPrompt = actualValuedbPrompt.replace(regex, ''); // Remove the placeholder
        }
      }

      aiResponse = await generateAndSavePromptHistory(
        prompts?.key,
        aiTool,
        actualValuedbPrompt,
        language,
        userId,
        'tool-content-idea'
      );

      const responseStrings = aiResponse.map((obj) => JSON.stringify(obj));

      for (const [index, responseString] of responseStrings.entries()) {
        const savedEntry = await models.promptHistoryModel.create({
          finalPrompt: actualValuedbPrompt,
          prompt: prompts._id,
          response: responseString,
          userId,
          projectId,
          key: projectType,
        });

        savedHistory.push({
          title: aiResponse[index].title,
          content: aiResponse[index].content,
          historyId: savedEntry._id,
          selected: false,
        });
      }

      finalPrompt = actualValuedbPrompt;
    } catch (error) {
      return responseHelper(
        res,
        httpStatus.INTERNAL_SERVER_ERROR,
        true,
        'An error occurred while generating more content ideas, please try again.'
      );
    }

    const formattedContentIdeas = formatContentIdeas(aiResponse);
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'generated more content ideas successfully.',
      { finalPrompt, contentIdeas: savedHistory }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function regenerateContentIdea(req, res, next) {
  try {
    const { projectId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { userId } = req.user;
    const { content, title } = req.body;

    const project = await getFullProjectDetails(projectId);

    let aiResponse,
      finalPrompt,
      type = 'content-idea-regenerate';
    try {
      const prompts = await models.promptModel.findOne({
        key: 'content_idea_regenerate',
      });

      let brandInfo = await models.clientBrandInfoModel.find({
        clientId: project.clientId,
      });      
      const dbPrompt = prompts.information + '\n\n' + prompts.instruction;
      const clientDetails = await clientFinetune(brandInfo[0], language);
      const dataSet = {
        adGoal: project?.projectBrief?.adGoals?.adGoal,
        toneOfVoice: project?.projectBrief?.toneOfVoice?.toneOfVoice,
        targetAudience: project?.projectBrief?.targetAudience,
        productServiceName: project?.projectBrief?.productServiceName,
        briefDescription: project?.projectBrief?.briefDescription,
        pillars: project?.projectBrief?.pillars,
        observationDays: project?.projectBrief?.observationDays,
        language: language,
        title: title,
        content: content,
        clientBrief: clientDetails,
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
          actualValuedbPrompt = actualValuedbPrompt.replace(
            regex,
            dataSet[key]
          ); // Replace the placeholder with the actual value
        } else {
          const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
          actualValuedbPrompt = actualValuedbPrompt.replace(regex, ''); // Remove the placeholder
        }
      }
      // const params = contentIdeaRegeneratePrompt(
      //   prompts?.key,
      //   project.clientId?.clientBrief,
      //   dataSet,
      //   title,
      //   content
      // );
      aiResponse = await generateAndSavePromptHistory(
        prompts?.key,
        aiTool,
        actualValuedbPrompt,
        language,
        userId,
        type
      );
      finalPrompt = actualValuedbPrompt;
    } catch (error) {
      return responseHelper(
        res,
        httpStatus.INTERNAL_SERVER_ERROR,
        true,
        'An error occurred while regenerating content ideas, please try again.'
      );
    }

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'content ideas regenerated successfully',
      { finalPrompt, contentIdea: { ...aiResponse, selected: false } }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

//NOT NEEDED
export async function saveContentIdeas(req, res, next) {
  try {
    const { projectId } = req.params;
    const { englishContentIdeas, arabicContentIdeas } = req.body;

    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const selectedEnglishContentIdeas = englishContentIdeas.filter(
      (idea) => idea.selected
    );
    const selectedArabicContentIdeas = arabicContentIdeas.filter(
      (idea) => idea.selected
    );
    const contentPlannerIds = [];
    //save selected english content ideas
    for (let contentIdea of selectedEnglishContentIdeas) {
      let existingPlanner = await models.socialMediaPlannerModel.findOne({
        title: contentIdea.title,
        content: contentIdea.content,
      });

      if (!existingPlanner) {
        const planner = await models.socialMediaPlannerModel.create({
          title: contentIdea.title,
          content: contentIdea.content,
        });
        contentPlannerIds.push({ language: 'english', plan: planner._id });
      }
    }

    //save selected arabic content ideas
    for (let contentIdea of selectedArabicContentIdeas) {
      let existingPlanner = await models.socialMediaPlannerModel.findOne({
        title: contentIdea.title,
        content: contentIdea.content,
      });

      if (!existingPlanner) {
        const planner = await models.socialMediaPlannerModel.create({
          title: contentIdea.title,
          content: contentIdea.content,
        });
        contentPlannerIds.push({ language: 'arabic', plan: planner._id });
      }
    }
    let exist = [];
    let contentPlannerId = await models.projectModel.findById(projectId);
    let plan = contentPlannerId.contentPlanner.socialMediaPlanner;

    for (const element of plan) {
      let item = await models.socialMediaPlannerModel.findById(element.plan);
      if (item.items.length === 0) {
        //need to check the isTool is not true (&& item.isTrue?. === false)
        exist.push(element.plan);
      }

      // Update projectModel
      await models.projectModel.updateOne(
        { _id: projectId },
        {
          $pull: {
            'contentPlanner.socialMediaPlanner': { plan: { $in: exist } },
          },
        }
      );

      // Delete plans from socialMediaPlannerModel
      await models.socialMediaPlannerModel.deleteMany({ _id: { $in: exist } });
    }
    //update id's in project
    await models.projectModel.findByIdAndUpdate(projectId, {
      'contentPlanner.contentIdeas': req.body.contentIdeas,
      $push: { 'contentPlanner.socialMediaPlanner': contentPlannerIds },
    });

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'content ideas saved successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

//NOT NEEDED
export async function getContentIdeas(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const savedPlannerIds = project?.contentPlanner?.socialMediaPlanner;
    const englishPlannerIds = savedPlannerIds?.filter(
      (planner) => planner.language === 'english'
    );
    const arabicPlannerIds = savedPlannerIds?.filter(
      (planner) => planner.language === 'arabic'
    );
    const englishContentPlans = [],
      arabicContentPlans = [];

    for (let planId of englishPlannerIds) {
      const plan = await models.socialMediaPlannerModel
        .findById(planId?.plan)
        .select('title content');
      if (plan) {
        englishContentPlans.push(plan);
      }
    }

    for (let planId of arabicPlannerIds) {
      const plan = await models.socialMediaPlannerModel
        .findById(planId?.plan)
        .select('title content');
      if (plan) {
        arabicContentPlans.push(plan);
      }
    }

    return responseHelper(res, httpStatus.OK, false, 'content ideas', {
      englishContentIdeas: englishContentPlans,
      arabicContentIdeas: arabicContentPlans,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

//NOT NEEDED
export async function getContentPlans(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await models.projectModel.findById(projectId);
    const savedPlannerIds = project?.contentPlanner?.socialMediaPlanner;
    const englishPlannerIds = savedPlannerIds.filter(
      (planner) => planner.language === 'english'
    );
    const arabicPlannerIds = savedPlannerIds.filter(
      (planner) => planner.language === 'arabic'
    );
    const englishContentPlans = [],
      arabicContentPlans = [];

    for (let planId of englishPlannerIds) {
      const plan = await models.socialMediaPlannerModel
        .findById(planId?.plan)
        .select('title items createdAt');
      if (plan) {
        englishContentPlans.push(plan);
      }
    }

    for (let planId of arabicPlannerIds) {
      const plan = await models.socialMediaPlannerModel
        .findById(planId?.plan)
        .select('title items createdAt');
      if (plan) {
        arabicContentPlans.push(plan);
      }
    }

    const modifiedEnglishPlanItems = [];
    const modifiedArabicPlanItems = [];

    const processPlanItem = async (planItem, modifiedPlanItemsArray) => {
      const modifiedItems = [];

      await Promise.all(
        planItem?.items?.map(async (item) => {
          const postWithImageIndex =
            item?.posts?.findIndex((post) => post.images.length > 0) === -1
              ? 0
              : item?.posts?.findIndex((post) => post.images.length > 0);
          const imageId = item.posts[postWithImageIndex]?.images[0];

          const imageData = await models.imageModel.findById(imageId);

          modifiedItems.push({
            post: item.posts[postWithImageIndex]?.post,
            image: imageData?.path || '',
            itemId: item._id,
            status: item.approval.status,
            createdAt: item.createdAt,
          });
        })
      );
      modifiedItems.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      modifiedPlanItemsArray.push({
        projectId: projectId,
        title: planItem.title,
        planId: planItem._id,
        items: modifiedItems,
        createdAt: planItem.createdAt,
      });
    };

    await Promise.all(
      englishContentPlans?.map((planItem) =>
        processPlanItem(planItem, modifiedEnglishPlanItems)
      )
    );
    await Promise.all(
      arabicContentPlans?.map((planItem) =>
        processPlanItem(planItem, modifiedArabicPlanItems)
      )
    );

    modifiedEnglishPlanItems.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    modifiedArabicPlanItems.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return responseHelper(res, httpStatus.CREATED, false, 'content plans', {
      englishContentPlans: modifiedEnglishPlanItems,
      arabicContentPlans: modifiedArabicPlanItems,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function generateCreatives(req, res, next) {
  try {
    const { projectId, planId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { userId } = req.user;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);
    if (!socialMediaPlanner) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Social media plan not found'
      );
    }

    let totalPost = ''; // Initialize totalPost as an empty string

    if (socialMediaPlanner.items.length > 0) {
      socialMediaPlanner.items?.forEach((item, key) => {
        if (item.posts?.length > 0) {
          totalPost += `post ${key + 1}: ${item.posts[0].post}\n`; // Concatenate each post with a newline character
        }
      });
    }
    let generatePostsAiResponse,
      generateImagesAndDallePromptAiResponse,
      finalPrompt,
      dbPrompt,
      actualValuedbPrompt;
    {
      let prompts;
      if (socialMediaPlanner.items.length > 0) {
        prompts = await models.promptModel.findOne({
          key: 'generate_more_post_under_same_idea_and_regenerate_post',
        });
      } else {
        prompts = await models.promptModel.findOne({
          key: 'generate_posts',
        });
      }
      //generate posts section

      dbPrompt = prompts.information + '\n\n' + prompts.instruction;
      // const content = postGeneratePrompt(
      //   [socialMediaPlanner],
      //   language,
      //   project.contentPlanner?.settings?.platforms
      // );

      const clientDetails = await clientFinetune(project.clientBrief, language);

      const dataSet = {
        adGoal: project?.projectBrief?.adGoals?.adGoal,
        toneOfVoice: project?.projectBrief?.toneOfVoice?.toneOfVoice,
        targetAudience: project?.projectBrief?.targetAudience,
        productServiceName: project?.projectBrief?.productServiceName,
        briefDescription: project?.projectBrief?.briefDescription,
        language: language,
        settings: listedsettings(project.contentPlanner?.settings?.platforms),
        title: socialMediaPlanner.title,
        content: socialMediaPlanner.content,
        posts: totalPost,
        clientBrief: clientDetails,
      };

      const dbKeys = dbPrompt.match(/[^\[\]]+(?=\])/g);
      for (const key in dataSet) {
        // Check if the key exists in dbKeys
        if (!dbKeys.includes(key)) {
          // Remove the key-value pair from the dataSet
          delete dataSet[key];
        }
      }
      actualValuedbPrompt = dbPrompt;
      for (const key in dataSet) {
        if (dataSet[key] !== undefined && dataSet[key] !== null) {
          const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
          actualValuedbPrompt = actualValuedbPrompt.replace(
            regex,
            dataSet[key]
          ); // Replace the placeholder with the actual value
        } else {
          const regex = new RegExp('\\[' + key + '\\]', 'g'); // Create a regex to match the placeholder
          actualValuedbPrompt = actualValuedbPrompt.replace(regex, ''); // Remove the placeholder
        }
      }
      // const params = postGeneratePrompt(
      //   prompts?.key,
      //   project?.clientBrief,
      //   dataSet,
      //   //contents passing here
      //   [socialMediaPlanner],
      //   language,
      //   project.contentPlanner?.settings?.platforms
      // );

      generatePostsAiResponse = await generateAndSavePromptHistory(
        prompts?.key,
        aiTool,
        actualValuedbPrompt,
        language,
        userId
      );
    }
    {
      //generate image ideas and dalle prompt section
      const prompts = await models.promptModel.findOne({
        key: 'image_ideas_and_dalle_prompt_generator',
      });
      const params = imageGenerationPrompt(
        'image_ideas_and_dalle_prompt_generator',
        generatePostsAiResponse,
        language
      );

      generateImagesAndDallePromptAiResponse =
        await generateAndSavePromptHistory(
          prompts?.key,
          aiTool,
          params,
          language,
          userId
        );
    }
    finalPrompt = actualValuedbPrompt;
    let responseBody = {};
    if (generatePostsAiResponse)
      responseBody['posts'] = generatePostsAiResponse;
    if (generateImagesAndDallePromptAiResponse)
      responseBody = {
        ...generateImagesAndDallePromptAiResponse,
        ...responseBody,
      };

    const client = {
      name: `${project?.clientId?.firstName} ${project?.clientId?.lastName}`,
      image:
        project?.clientId?.clientImage?.path || project?.clientId?.clientImage,
    };
    responseBody['client'] = client;
    responseBody['planId'] = planId;
    responseBody['_id'] = null;
    responseBody['finalPrompt'] = finalPrompt;
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'creatives generated successfully',
      responseBody
    );
  } catch (error) {
    console.log(error);
    // return next(new Error(error));
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      'An error occurred while generating the post, please try again.'
    );
  }
}

export async function generateSocialMediaPost(req, res, next) {
  try {
    const { projectId, historyId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { userId } = req.user;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const contentHistory = await models.promptHistoryModel.findById(historyId);
    if (!contentHistory) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Content not found'
      );
    }
    const jsonData = JSON.parse(contentHistory.response);
    let generatePostsAiResponse,
      brandInfo,
      generateImagesAndDallePromptAiResponse,
      finalPrompt,
      dbPrompt,
      actualValuedbPrompt,
      parentId,
      savedHistory = [];
    {
      let prompts = await models.promptModel.findOne({
        key: 'generate_posts',
      });

      dbPrompt = prompts.information + '\n\n' + prompts.instruction;
      brandInfo = await models.clientBrandInfoModel.find({
        clientId: project.clientId,
      });

      const clientDetails = await clientFinetune(brandInfo[0], language);
  
      const dataSet = {
        adGoal: project?.projectBrief?.adGoals?.adGoal,
        toneOfVoice: project?.projectBrief?.toneOfVoice?.toneOfVoice,
        targetAudience: project?.projectBrief?.targetAudience,
        productServiceName: project?.projectBrief?.productServiceName,
        briefDescription: project?.projectBrief?.briefDescription,
        pillars: project?.projectBrief?.pillars,
        observationDays: project?.projectBrief?.observationDays,
        language: language,
        settings:await listedsettings(project.contentPlanner?.settings?.platforms),
        title: jsonData.title,
        content: jsonData.content,
        clientBrief: clientDetails,
      };

      const dbKeys = dbPrompt.match(/[^\[\]]+(?=\])/g);
      for (const key in dataSet) {
        if (!dbKeys.includes(key)) {
          delete dataSet[key];
        }
      }
      actualValuedbPrompt = dbPrompt;
      for (const key in dataSet) {
        if (dataSet[key] !== undefined && dataSet[key] !== null) {
          const regex = new RegExp('\\[' + key + '\\]', 'g');
          actualValuedbPrompt = actualValuedbPrompt.replace(
            regex,
            dataSet[key]
          );
        } else {
          const regex = new RegExp('\\[' + key + '\\]', 'g');
          actualValuedbPrompt = actualValuedbPrompt.replace(regex, '');
        }
      }

      generatePostsAiResponse = await generateAndSavePromptHistory(
        prompts?.key,
        aiTool,
        actualValuedbPrompt,
        language,
        userId,
        'post-generate',
        projectId
      );

      const responseStrings = generatePostsAiResponse.map((obj) =>
        JSON.stringify(obj)
      );

      for (const [index, responseString] of responseStrings.entries()) {
        const savedEntry = await models.promptHistoryModel.create({
          finalPrompt: actualValuedbPrompt,
          prompt: prompts._id,
          response: responseString,
          language,
          userId,
          projectId,
          key: 'generate_posts',
        });
        savedEntry.parentId = savedEntry._id;
        await savedEntry.save();
        savedHistory.push({
          post: generatePostsAiResponse[index].post,
          platform: generatePostsAiResponse[index].platform,
          historyId: savedEntry._id,
          parentId: savedEntry._id,
        });
      }

    //   let history = await models.promptHistoryModel.create({
    //     finalPrompt: actualValuedbPrompt,
    //     prompt: prompts._id,
    //     response: JSON.stringify(generatePostsAiResponse),
    //     userId,
    //     language,
    //     projectId,
    //     key: 'generate_posts',
    //   });

    //   history.parentId = history._id;
    //   parentId = history._id;
    //   await history.save();
    }
    {
      const prompts = await models.promptModel.findOne({
        key: 'image_ideas_and_dalle_prompt_generator',
      });

      const postIdeas = savedHistory
        .map((item, index) => `${index + 1}. ${item.platform} : ${item.post}`)
        .join('\n');
      const params = await imageGenerationParamsPrompt(
        project,
        postIdeas,
        language
      );

      generateImagesAndDallePromptAiResponse =
        await generateAndSavePromptHistory(
          prompts?.key,
          aiTool,
          params,
          language,
          userId
        );
    }
    finalPrompt = actualValuedbPrompt;
    let responseBody = {};
    if (generatePostsAiResponse) responseBody['posts'] = savedHistory;
    if (generateImagesAndDallePromptAiResponse)
      responseBody = {
        ...generateImagesAndDallePromptAiResponse,
        ...responseBody,
      };

    const client = {
      name: `${project?.clientId?.firstName} ${project?.clientId?.lastName}`,
      image:
        project?.clientId?.clientImage?.path || project?.clientId?.clientImage,
    };
    responseBody['client'] = client;
    responseBody['contentId'] = historyId;
    //responseBody['parentId'] = parentId;
    responseBody['finalPrompt'] = finalPrompt;
    responseBody['title'] = jsonData.title;
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'creatives generated successfully',
      responseBody
    );
  } catch (error) {
    console.log(error);
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      'An error occurred while generating the post, please try again.'
    );
  }
}

export async function generateSinglePost(req, res, next) {
  try {
    const { projectId, planId, platform } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { userId } = req.user;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);
    if (!socialMediaPlanner) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Social media plan not found'
      );
    }
    let finalPrompt;
    //generate posts section
    const prompts = await models.promptModel.findOne({
      key: 'generate_single_post',
    });
    const dbPrompt = prompts.information + '\n\n' + prompts.instruction;
    const clientDetails = await clientFinetune(project.clientBrief, language);
    const dataSet = {
      adGoal: project?.projectBrief?.adGoals?.adGoal,
      toneOfVoice: project?.projectBrief?.toneOfVoice?.toneOfVoice,
      targetAudience: project?.projectBrief?.targetAudience,
      productServiceName: project?.projectBrief?.productServiceName,
      briefDescription: project?.projectBrief?.briefDescription,
      language: language,
      title: socialMediaPlanner.title,
      content: socialMediaPlanner.content,
      platform: platform,
      clientBrief: clientDetails,
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
    // const params = singlePostGeneratePrompt(
    //   prompts?.key,
    //   project?.clientBrief,
    //   dataSet,
    //   //contents passing here
    //   [socialMediaPlanner],
    //   language,
    //   platform
    // );

    let generatePostAiResponse = await generateAndSavePromptHistory(
      prompts?.key,
      aiTool,
      actualValuedbPrompt,
      language,
      userId
    );
    finalPrompt = actualValuedbPrompt;
    generatePostAiResponse['finalPrompt'] = finalPrompt;
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'post generated successfully',
      generatePostAiResponse
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function regenerateSinglePost(req, res, next) {
  try {
    const { projectId, planId, platform } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { post } = req.body;
    const { userId } = req.user;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);
    if (!socialMediaPlanner) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Social media plan not found'
      );
    }
    let finalPrompt;
    //generate posts section
    const prompts = await models.promptModel.findOne({
      key: 'regenerate_single_post',
    });
    let brandInfo = await models.clientBrandInfoModel.find({
      clientId: project.clientId,
    });
    const dbPrompt = prompts.information + '\n\n' + prompts.instruction;
    const clientDetails = await clientFinetune(brandInfo[0], language);
    const dataSet = {
      adGoal: project?.projectBrief?.adGoals?.adGoal,
      toneOfVoice: project?.projectBrief?.toneOfVoice?.toneOfVoice,
      targetAudience: project?.projectBrief?.targetAudience,
      productServiceName: project?.projectBrief?.productServiceName,
      briefDescription: project?.projectBrief?.briefDescription,
      pillars: project?.projectBrief?.pillars,
        observationDays: project?.projectBrief?.observationDays,
      clientBrief: clientDetails,
      title: socialMediaPlanner.title,
      content: socialMediaPlanner.content,
      language: language,
      post: post,
      platform: platform,
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
    //const params = postRegeneratePrompt(prompts?.key, platform, post, language);

    let regeneratePostAiResponse = await generateAndSavePromptHistory(
      prompts?.key,
      aiTool,
      actualValuedbPrompt,
      language,
      userId
    );
    finalPrompt = actualValuedbPrompt;
    const planner = await models.socialMediaPlannerModel.findOneAndUpdate(
      {
        _id: planId,
        'items.posts.platform': platform,
      },
      {
        $set: {
          'items.posts.$[inner].post': regeneratePostAiResponse.post,
        },
      },
      {
        arrayFilters: [{ 'inner.platform': platform }],
        new: true,
      }
    );
    const client = {
      name: `${project?.clientId?.firstName} ${project?.clientId?.lastName}`,
      image:
        project?.clientId?.clientImage?.path || project?.clientId?.clientImage,
    };
    regeneratePostAiResponse['client'] = client;
    regeneratePostAiResponse['finalPrompt'] = finalPrompt;
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'post regenerated and saved successfully',
      regeneratePostAiResponse
    );
  } catch (error) {
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      'An error occurred while regenerating the post, please try again.'
    );
    // return next(new Error(error));
  }
}

export async function regenerateImageIdeas(req, res, next) {
  try {
    const { projectId, planId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { imageIdeas } = req.body;
    const { userId } = req.user;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    let finalPrompt;
    //generate posts section
    const prompts = await models.promptModel.findOne({
      key: 'image_ideas_regenerate',
    });
    let brandInfo = await models.clientBrandInfoModel.find({
      clientId: project.clientId,
    });
    const clientDetails = await clientFinetune(brandInfo[0], language);
    const designDetails = await designFinetune(
      project.designBrief ? project.designBrief : '',
      language
    );
    const dbPrompt = prompts.information + '\n\n' + prompts.instruction;
    const dataSet = {
      adGoal: project?.projectBrief?.adGoals?.adGoal,
      toneOfVoice: project?.projectBrief?.toneOfVoice?.toneOfVoice,
      targetAudience: project?.projectBrief?.targetAudience,
      productServiceName: project?.projectBrief?.productServiceName,
      briefDescription: project?.projectBrief?.briefDescription,
      pillars: project?.projectBrief?.pillars,
        observationDays: project?.projectBrief?.observationDays,
      clientBrief: clientDetails,
      language: language,
      imageIdeas: imageIdeas,
      designBrief:designDetails
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
    // const params = imageIdeaRegeneratePromptV2(
    //   prompts?.key,
    //   imageIdeas,
    //   language
    // );

    let regenerateImageIdeasAiResponse = await generateAndSavePromptHistory(
      prompts?.key,
      aiTool,
      actualValuedbPrompt,
      language,
      userId
    );

    finalPrompt = actualValuedbPrompt;
    const filter = {
      _id: planId,
      projectId: projectId,
    };

    const update = {
      $set: { 'items.imageIdeas': regenerateImageIdeasAiResponse.imageIdeas },
    };
    await models.socialMediaPlannerModel.updateOne(filter, update);
    regenerateImageIdeasAiResponse['finalPrompt'] = finalPrompt;
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'image ideas regenerated and saved succesfully',
      regenerateImageIdeasAiResponse
    );
  } catch (error) {
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      'An error occurred while regenerating image ideas, please try again.'
    );
    // return next(new Error(error));
  }
}
export async function regenerateDallePrompt(req, res, next) {
  try {
    const { projectId, planId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { dallePrompt } = req.body;
    const { userId } = req.user;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    let finalPrompt;
    const prompts = await models.promptModel.findOne({
      key: 'dalle_prompt_regenerate',
    });

    let brandInfo = await models.clientBrandInfoModel.find({
      clientId: project.clientId,
    });
    const clientDetails = await clientFinetune(brandInfo[0], language);
    const designDetails = await designFinetune(
      project.designBrief ? project.designBrief : '',
      language
    );
    const dbPrompt = prompts.information + '\n\n' + prompts.instruction;
    const dataSet = {
      adGoal: project?.projectBrief?.adGoals?.adGoal,
      toneOfVoice: project?.projectBrief?.toneOfVoice?.toneOfVoice,
      targetAudience: project?.projectBrief?.targetAudience,
      productServiceName: project?.projectBrief?.productServiceName,
      briefDescription: project?.projectBrief?.briefDescription,
      pillars: project?.projectBrief?.pillars,
        observationDays: project?.projectBrief?.observationDays,
      clientBrief: clientDetails,
      language: language,
      dallePrompt: dallePrompt,
      designBrief:designDetails
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

    // const params = dallePromptRegeneratePrompt(
    //   prompts?.key,
    //   dallePrompt,
    //   language
    // );

    let regenerateDallePromptAiResponse = await generateAndSavePromptHistory(
      prompts?.key,
      aiTool,
      actualValuedbPrompt,
      language,
      userId
    );
    finalPrompt = actualValuedbPrompt;
    const filter = {
      _id: planId,
      projectId: projectId,
    };

    const update = {
      $set: {
        'items.dallePrompt': regenerateDallePromptAiResponse.dallePrompt,
      },
    };
    await models.socialMediaPlannerModel.updateOne(filter, update);
    regenerateDallePromptAiResponse['finalPrompt'] = finalPrompt;
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'dalle prompt regenerated and saved successfully',
      regenerateDallePromptAiResponse
    );
  } catch (error) {
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      'An error occurred while regenerating dalle prompt, please try again.'
    );
    // return next(new Error(error));
  }
}

export async function saveContentPlanner(req, res, next) {
  try {
    const { projectId, planId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { imageIdeas, dallePrompt, posts } = req.body;
    const { userId } = req.user;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const client = {
      name: `${project?.clientId?.firstName} ${project?.clientId?.lastName}`,
      image:
        project?.clientId?.clientImage?.path || project?.clientId?.clientImage,
    };
    const socialMediaPlan =
      await models.socialMediaPlannerModel.findById(planId);
    if (!socialMediaPlan) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Social media plan not found'
      );
    }
    const savedPlanItem =
      await models.socialMediaPlannerModel.findByIdAndUpdate(
        planId,
        {
          $push: {
            items: {
              imageIdeas,
              dallePrompt,
              posts,
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      );
    //latest item
    const latestItem = savedPlanItem?.items?.[savedPlanItem?.items?.length - 1];
    if (!latestItem) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'Item not found');
    }
    const planData = { planId: planId, ...latestItem.toObject() };
    //planData['client'] = client;
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'social media content saved successfully',
      { plan: planData, client: client }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function saveContentPlannerPost(req, res, next) {
  try {
    const { projectId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { imageIdeas, dallePrompt, posts, title } = req.body;
    const { userId } = req.user;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const client = {
      name: `${project?.clientId?.firstName} ${project?.clientId?.lastName}`,
      image:
        project?.clientId?.clientImage?.path || project?.clientId?.clientImage,
    };

    const newPlanItem = {
      title,
      projectId,
      items: {
        imageIdeas,
        dallePrompt,
        posts,
        createdAt: new Date(),
      },
    };

    const savedPlanItem =
      await models.socialMediaPlannerModel.create(newPlanItem);

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'social media content saved successfully',
      { plan: savedPlanItem, client: client }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function updateContentPlanner(req, res, next) {
  try {
    const { projectId, id } = req.params;
    const { imageIdeas, dallePrompt, posts, content } = req.body;
    const { userId } = req.user;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const socialMediaPlan = await models.socialMediaPlannerModel.findById(id);
    if (socialMediaPlan) {
      const selectedItem = socialMediaPlan?.items;

      if (!selectedItem) {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'item not found'
        );
      }
      selectedItem.imageIdeas = imageIdeas;
      selectedItem.dallePrompt = dallePrompt;
      posts.forEach((updatedPost) => {
        const correspondingPost = selectedItem.posts.find(
          (post) => post?._id.toString() === updatedPost._id
        );
        if (correspondingPost) {
          correspondingPost.post = updatedPost.post;
        }
      });

      await socialMediaPlan.save();
    } else {
      const promptHistory = await models.promptHistoryModel.findById(id);
      if (promptHistory) {
        const jsonData = JSON.parse(promptHistory.response);
        let data = {
          title: jsonData.title,
          content: content,
        };
        promptHistory.response = JSON.stringify(data);
        await promptHistory.save();
      } else {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'Content not found'
        );
      }
    }

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Data updated successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getContentPlannerItem(req, res, next) {
  try {
    const { projectId, planId, itemId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { userId } = req.user;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const client = {
      name: `${project?.clientId?.firstName} ${project?.clientId?.lastName}`,
      image:
        project?.clientId?.clientImage?.path || project?.clientId?.clientImage,
    };

    const socialMediaPlanner = await models.socialMediaPlannerModel
      .findById(planId)
      .populate({ path: 'items.posts.images', select: 'path _id' })
      .populate({
        path: 'items.approval.comments.commentedBy',
        select: 'userImage firstName lastName',
      });
    const item = socialMediaPlanner?.items?.find((item) => item._id == itemId);
    const {
      approval: { status, comments },
      ...rest
    } = item.toObject();
    if (!item) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'Item not found');
    }
    const itemData = {
      projectId: projectId,
      planId: planId,
      status: item.approval.status,
      comments: item.approval.comments,
      ...rest,
    };
    // itemData['client'] = client;
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'social media planner item',
      { item: itemData, client: client }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function contentPlannerItemGenerateImage(req, res, next) {
  try {
    const { projectId, planId } = req.params;
    const { userId } = req.user;
    const { dallePrompt } = req.body;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const client = {
      name: `${project?.clientId?.firstName} ${project?.clientId?.lastName}`,
      image:
        project?.clientId?.clientImage?.path || project?.clientId?.clientImage,
    };
    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);

    const fileSavePath = path.join(
      getCurrentWorkingFolder(import.meta.url),
      '../../../public/uploads/images'
    );
    const imageGenerationResponse = await generateImage(dallePrompt);
    //save history
    const finalResponse =
      imageGenerationResponse.data && imageGenerationResponse.data.length > 0
        ? `${imageGenerationResponse.data[0].revised_prompt} /n/n image=> ${imageGenerationResponse.data[0].url}`
        : 'image generation error';
    //save history
    await models.promptHistoryModel.create({
      finalPrompt: dallePrompt,
      projectId,
      response: finalResponse,
      userId,
      key: 'ai_generated_image',
    });

    //save image locally
    const imageSaveResponse = await downloadAndSaveImage(
      imageGenerationResponse.data[0].url,
      fileSavePath
    );

    const imageSavedPath = '/cdn/uploads/images/' + imageSaveResponse.fileName;
    //add image in db
    const dbImage = await models.imageModel.create({
      fileName: imageSaveResponse.fileName,
      name: imageSaveResponse.fileName,
      path: imageSavedPath,
    });

    socialMediaPlanner.items.dalleGeneratedImages.push({
      image: dbImage._id,
      path: imageSavedPath,
    });
    await socialMediaPlanner?.save();

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'image generated successfully',
      { finalPrompt: dallePrompt, image: imageSavedPath, client }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function contentPlannerItemDeleteGeneratedImage(req, res, next) {
  try {
    const { projectId, planId, imageId } = req.params; //image id is _id of array item

    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);

    const selectedImageIndex =
      socialMediaPlanner?.items?.dalleGeneratedImages.findIndex(
        (image) => image._id?.toString() === imageId
      );
    const selectedImage = socialMediaPlanner?.items?.dalleGeneratedImages.find(
      (image) => image._id?.toString() === imageId
    );

    if (!selectedImage) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'image not found');
    }
    //remove image locally
    const fullImagePath = path
      .join(
        getCurrentWorkingFolder(import.meta.url),
        `../../../public${selectedImage.path}`
      )
      .replace(/[]/g, '')
      .replace(/cdn/, '');
    await unlinkSync(fullImagePath);

    // remove image from db
    await models.imageModel.findByIdAndDelete(selectedImage?.image);

    socialMediaPlanner.items.dalleGeneratedImages.splice(selectedImageIndex, 1);
    socialMediaPlanner?.save();

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'image is removed successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function contentPlannerItemUploadImage(req, res, next) {
  try {
    const { projectId, planId, postId } = req.params;
    if ([projectId, planId, postId].includes('undefined')) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        '"projectId", "planId", "postId" are required'
      );
    }
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { dallePrompt } = req.body;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const images = req.files.image;

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);

    const selectedItem = socialMediaPlanner?.items;
    const selectedPost = selectedItem?.posts?.find(
      (post) => post._id == postId
    );
    if (!selectedPost) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'post is not exists'
      );
    }
    //add image in db
    const DBimages = [];
    for (const image of images) {
      let DBimage = await models.imageModel.create({
        name: image.originalname,
        fileName: image.filename,
        path: '/cdn/uploads/images/' + image.filename,
      });
      DBimages.push(DBimage._id.toString());
    }

    selectedPost.images =
      selectedPost?.images && selectedPost?.images.length > 0
        ? selectedPost?.images.concat(DBimages)
        : DBimages;
    await socialMediaPlanner?.save();

    const client = {
      name: `${project?.clientId?.firstName} ${project?.clientId?.lastName}`,
      image:
        project?.clientId?.clientImage?.path || project?.clientId?.clientImage,
    };

    const MediaPlanner = await models.socialMediaPlannerModel
      .findById(planId)
      .populate({ path: 'items.posts.images', select: 'path _id' })
      .populate({
        path: 'items.approval.comments.commentedBy',
        select: 'userImage firstName lastName',
      });
    const item = MediaPlanner?.items;
    const {
      approval: { status, comments },
      ...rest
    } = item.toObject();
    if (!item) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'Item not found');
    }
    const itemData = {
      projectId: projectId,
      planId: planId,
      status: item.approval.status,
      comments: item.approval.comments,
      ...rest,
    };
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `successfully uploaded the image for the ${selectedPost.platform} post.`,
      { item: itemData, client: client }
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function contentPlannerItemDeleteUploadImage(req, res, next) {
  try {
    const { projectId, planId, postId, imageId } = req.params;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);

    const selectedItem = socialMediaPlanner?.items;
    const selectedPost = (selectedItem?.posts).find(
      (post) => post._id == postId
    );

    const selectedImageIndex = selectedPost?.images.findIndex(
      (image) => image.toString() === imageId
    );

    if (selectedImageIndex < 0) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'image not found');
    }
    //remove from images collection
    await models.imageModel.findByIdAndDelete(imageId);
    selectedPost?.images.splice(selectedImageIndex, 1);
    socialMediaPlanner?.save();
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'image is removed successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function addComment(req, res, next) {
  try {
    const { projectId, planId } = req.params;
    const { comment } = req.body;
    const { userId } = req.user;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);

    socialMediaPlanner?.items?.approval?.comments.push({
      comment: comment,
      commentedBy: userId,
    });

    await socialMediaPlanner?.save();

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'comment added successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function removeItemById(req, res, next) {
  try {
    const { projectId, planId, itemId } = req.params;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    let item = await models.socialMediaPlannerModel.findOne({
      _id: planId,
      'items._id': itemId,
    });
    if (!item) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'Item not found');
    }
    await models.socialMediaPlannerModel.findOneAndUpdate(
      { _id: planId },
      {
        $pull: {
          items: { _id: itemId },
        },
      },
      { new: true }
    );

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Plan item is deleted'
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function removeComment(req, res, next) {
  try {
    const { projectId, planId, commentId } = req.params;

    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);

    const selectedCommentIndex =
      socialMediaPlanner?.items?.approval?.comments.findIndex(
        (comment) => comment._id?.toString() === commentId
      );

    if (!selectedCommentIndex < 0) {
      //commend not found
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'comment not found'
      );
    }

    selectedItem?.approval?.comments.splice(selectedCommentIndex, 1);
    socialMediaPlanner?.save();

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'comment removed successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function editSocialMediaContentPlanner(req, res, next) {
  try {
    const { planId, itemId } = req.params;
    const { posts, dallePrompt, imageIdeas } = req.body;

    const updateOperation = {
      'items.$[item].posts.$[].post': posts[0]?.post,
      'items.$[item].dallePrompt': dallePrompt,
      'items.$[item].imageIdeas': imageIdeas,
    };

    const options = {
      new: true,
      arrayFilters: [{ 'item._id': itemId }],
    };

    await models.socialMediaPlannerModel.findOneAndUpdate(
      { _id: planId },
      { $set: updateOperation },
      options
    );

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'content Planner updated successfully.'
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function getSocialMediaPlannerById(req, res, next) {
  try {
    const { planId } = req.params;
    const plan = await models.socialMediaPlannerModel
      .findById(planId)
      .populate({
        path: 'items.posts.images',
        model: 'Image',
      })
      .populate({
        path: 'items.approval.comments.commentedBy',
        model: 'User',
        select: 'firstName lastName userImage',
      });
    if (!plan) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Content planner not found'
      );
    }

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'social media planner',
      {
        post: plan,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function updatePostStatus(req, res, next) {
  try {
    const { projectId, planId } = req.params;
    const { status } = req.body;
    const { userId } = req.user;

    // if (req.user.role != 'admin' && req.user.role != 'Project Manager') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to update post status.'
    //   );
    // }

    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const creatorName = await getUserName(req.user.userId);

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);

    const selectedItem = socialMediaPlanner?.items;
    let statusMessage;

    if (status === 'SubmitToClient') {
      statusMessage = 'Submit to client';
    } else if (status === 'ApprovedByClient') {
      statusMessage = 'Approved by client';
    } else {
      statusMessage = status;
    }
    if (
      status == 'SubmitToClient' &&
      !['Approved'].includes(selectedItem.approval.status)
    ) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'Only approved post can be submit to Client'
      );
    }
    let statusToDisplay = '';
    if (
      status == 'Approved' &&
      !['Rework', 'Inprogress'].includes(selectedItem.approval.status)
    ) {
      if (selectedItem.approval.status === 'RejectedByClient') {
        statusToDisplay = 'Rejected by Client';
      } else if (selectedItem.approval.status === 'ReworkByClient') {
        statusToDisplay = 'Rework by Client';
      }
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `Can not approve the post with status ${
          statusToDisplay || selectedItem.approval.status
        }.`
      );
    }

    if (
      status == 'Rework' &&
      ['Approved', 'ApprovedByClient', 'SubmitToClient'].includes(
        selectedItem.approval.status
      )
    ) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `Can not Rework the post with status ${selectedItem.approval.status} .`
      );
    }
    if (
      status == 'Rejected' &&
      !['Rejected', 'Rework', 'Inprogress'].includes(
        selectedItem.approval.status
      )
    ) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `Can not Reject the post with status ${selectedItem.approval.status} .`
      );
    }
    selectedItem.approval.status = status;
    await socialMediaPlanner?.save();
    let notificationContent = `${creatorName} updated the status of post '${socialMediaPlanner.title}' in project '${project.name}' to '${statusMessage}'.`;

    project.projectCoordinators.forEach(async (coordinator) => {
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForUser: coordinator.projectCoordinator,
      });
    });

    project.clientUsers.forEach(async (user) => {
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForClientUser: user.clientUser,
      });
    });

    await models.notificationModel.create({
      content: notificationContent,
      createdByUser: req.user.userId,
      createdForClient: project.clientId,
    });
    await models.notificationModel.create({
      content: notificationContent,
      createdByUser: req.user.userId,
      createdForClientUser: project.owner,
    });

    switch (req.user.role) {
      case 'admin':
        await sendNotificationsForRole(
          'Project Manager',
          req.user.userId,
          notificationContent
        );
        break;
      case 'Project Manager':
        await sendNotificationsForRole(
          'admin',
          req.user.userId,
          notificationContent
        );
        break;
      default:
        await sendNotificationsForRole(
          'admin',
          req.user.userId,
          notificationContent
        );
        await sendNotificationsForRole(
          'Project Manager',
          req.user.userId,
          notificationContent
        );
        break;
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `post status updated to ${statusMessage} successfully`
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function schedule(req, res, next) {
  try {
    const { planId, projectId } = req.params;
    const project = await models.projectModel.findById(projectId);
    const creatorName = await getUserName(req.user.userId);

    const plan = await models.socialMediaPlannerModel.findOne({
      _id: planId,
      projectId: projectId,
    });

    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'Plan not found');
    }

    const { scheduleDate } = req.body;

    if (
      plan.items?.approval.status !== 'ApprovedByClient' &&
      plan.items?.approval.status !== 'Approved'
    ) {
      if (selectedItem.scheduledDate != null) {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'The item already scheduled'
        );
      } else {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          `Can not schedule the post with status ${plan.items.approval.status} .`
        );
      }
    }
    const parseDateString = (dateString) => {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month}-${day}T00:00:00.000Z`;
    };
    const schedule = parseDateString(scheduleDate);
    const date = new Date(schedule);
    const formattedDate = date.toISOString().split('T')[0];
    await models.socialMediaPlannerModel.findOneAndUpdate(
      { _id: planId, projectId: projectId },
      {
        $set: {
          'items.scheduledDate': schedule,
        },
      },
      { new: true, runValidators: true }
    );
    let notificationContent = `${creatorName} Schdeuled a content of post '${plan.title}' for project '${project.name}' to ${formattedDate}.`;

    project.projectCoordinators.forEach(async (coordinator) => {
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForUser: coordinator.projectCoordinator,
      });
    });

    project.clientUsers.forEach(async (user) => {
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForClientUser: user.clientUser,
      });
    });

    await models.notificationModel.create({
      content: notificationContent,
      createdByUser: req.user.userId,
      createdForClient: project.clientId,
    });
    await models.notificationModel.create({
      content: notificationContent,
      createdByUser: req.user.userId,
      createdForClientUser: project.owner,
    });
    switch (req.user.role) {
      case 'admin':
        await sendNotificationsForRole(
          'Project Manager',
          req.user.userId,
          notificationContent
        );
        break;
      case 'Project Manager':
        await sendNotificationsForRole(
          'admin',
          req.user.userId,
          notificationContent
        );
        break;
      default:
        await sendNotificationsForRole(
          'admin',
          req.user.userId,
          notificationContent
        );
        await sendNotificationsForRole(
          'Project Manager',
          req.user.userId,
          notificationContent
        );
        break;
    }
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Post scheduled successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

//NOT NEEDED
export async function bulkActionsSection(req, res, next) {
  try {
    const { selectedContents, scheduleDate } = req.body;
    const { action } = req.query;
    const { projectId } = req.params;
    // if (req.user.role != 'admin' && req.user.role != 'Project Manager') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to do this action.'
    //   );
    // }
    let project = await models.projectModel.findById(projectId);
    const creatorName = await getUserName(req.user.userId);

    let titles = [],
      allConditionsSatisfied = true,
      planner,
      schedule;
    const changesForItems = [];
    await Promise.all(
      selectedContents.map(async ({ planId }) => {
        planner = await models.socialMediaPlannerModel.findById(planId);

        if (!selectedContents) {
          return responseHelper(
            res,
            httpStatus.NOT_FOUND,
            true,
            `Please choose atleast one item.`
          );
        }
        if (action == 'schedule' && !scheduleDate) {
          return responseHelper(
            res,
            httpStatus.NOT_FOUND,
            true,
            `Schedule date is missing`
          );
        }
        if (!planner) {
          return responseHelper(
            res,
            httpStatus.NOT_FOUND,
            true,
            `plan not found`
          );
        }

        if (action == 'schedule') {
          const parseDateString = (dateString) => {
            const [day, month, year] = dateString.split('-');
            return `${year}-${month}-${day}T00:00:00.000Z`;
          };
          schedule = parseDateString(scheduleDate);
        }
        const selectedItemIndex = planner?.items;
        if (!selectedItemIndex) {
          return responseHelper(
            res,
            httpStatus.NOT_FOUND,
            true,
            `Content item not found for id: ${planId}`
          );
        }
        titles.push(planner.title);
        let changes = {};
        switch (action) {
          case 'schedule':
            if (
              ['ApprovedByClient', 'Approved'].includes(
                selectedItemIndex.approval.status
              )
            ) {
              changes = {
                scheduledDate: schedule,
                // approvalStatus: 'Scheduled',
              };
            } else {
              allConditionsSatisfied = false;
            }
            break;

          case 'reject':
            if (
              ['Rejected', 'Rework', 'Inprogress'].includes(
                selectedItemIndex.approval.status
              )
            ) {
              changes = { approvalStatus: 'Rejected' };
            } else {
              allConditionsSatisfied = false;
            }
            break;

          case 'rework':
            if (
              [
                'Rejected',
                'Rework',
                'Inprogress',
                'ReworkByClient',
                //'RejectedByClient',
              ].includes(selectedItemIndex.approval.status)
            ) {
              changes = { approvalStatus: 'Rework' };
            } else {
              allConditionsSatisfied = false;
            }
            break;

          case 'submitToClient':
            if (selectedItemIndex.approval.status === 'Approved') {
              changes = { approvalStatus: 'SubmitToClient' };
            } else {
              allConditionsSatisfied = false;
            }
            break;

          case 'approve':
            if (
              ['Inprogress', 'Rework'].includes(
                selectedItemIndex.approval.status
              )
            ) {
              changes = { approvalStatus: 'Approved' };
            } else {
              allConditionsSatisfied = false;
            }
            break;

          default:
            allConditionsSatisfied = false;
            break;
        }
        if (!allConditionsSatisfied) {
          return;
        }

        changesForItems.push({
          planId: planId,
          scheduledDate: changes.scheduledDate,
          approvalStatus: changes.approvalStatus,
        });
      })
    );

    if (allConditionsSatisfied) {
      for (const { planId, scheduledDate, approvalStatus } of changesForItems) {
        await models.socialMediaPlannerModel.findOneAndUpdate(
          { _id: planId },
          {
            $set: {
              'items.scheduledDate': scheduledDate,
              'items.approval.status': approvalStatus,
            },
          },
          { new: true, runValidators: true }
        );
      }
    } else {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `Some conditions were not satisfied. Kindly review the status of the post(s).`
      );
    }
    const uniqueTitles = [...new Set(titles)];
    let notificationContent;
    for (const title of uniqueTitles) {
      let date, formattedDate;
      if (action === 'schedule') {
        date = new Date(schedule);
        formattedDate = date.toISOString().split('T')[0];
      }
      action === 'schedule'
        ? (notificationContent = `${creatorName} scheduled some contents of post '${title}' for project '${project.name}' to ${formattedDate}.`)
        : (notificationContent = `${creatorName} updated some contents of post '${title}' for project '${project.name}' to ${action}.`);

      project.projectCoordinators.forEach(async (coordinator) => {
        await models.notificationModel.create({
          content: notificationContent,
          createdByUser: req.user.userId,
          createdForUser: coordinator.projectCoordinator,
        });
      });

      project.clientUsers.forEach(async (user) => {
        await models.notificationModel.create({
          content: notificationContent,
          createdByUser: req.user.userId,
          createdForClientUser: user.clientUser,
        });
      });

      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForClient: project.clientId,
      });
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForClientUser: project.owner,
      });
    }

    switch (req.user.role) {
      case 'admin':
        await sendNotificationsForRole(
          'Project Manager',
          req.user.userId,
          notificationContent
        );
        break;
      case 'Project Manager':
        await sendNotificationsForRole(
          'admin',
          req.user.userId,
          notificationContent
        );
        break;
      default:
        await sendNotificationsForRole(
          'admin',
          req.user.userId,
          notificationContent
        );
        await sendNotificationsForRole(
          'Project Manager',
          req.user.userId,
          notificationContent
        );
        break;
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `planner(s) status updated to ${action} successfully`
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getFiltersItems(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const socialMediaPlanWithItems =
      project?.contentPlanner?.socialMediaPlanner?.filter(
        (item) => item?.plan?.items?.length > 0
      );
    const planItems = socialMediaPlanWithItems?.flatMap((item) => item);
    const modifiedPlanItems = [];

    planItems?.map((planItem) => {
      const planId = planItem?.plan?._id;
      planItem?.plan?.items?.map((item) => {
        const postWithImageIndex =
          item.posts?.findIndex((post) => post.images.length > 0) === -1
            ? 0
            : item.posts?.findIndex((post) => post.images.length > 0);
        const scheduledDate = item.scheduledDate
          ? new Date(item.scheduledDate).toISOString().split('T')[0]
          : null;

        modifiedPlanItems.push({
          projectId: projectId,
          language: planItem.language,
          status: item.approval.status,
          comments: item.comments || '',
          scheduledDate: scheduledDate || '',
          post: item.posts[postWithImageIndex]?.post || '',
          image: item.posts[postWithImageIndex]?.images[0]?.path || '',
          itemId: item._id,
          planId,
        });
      });
    });

    const all = modifiedPlanItems;
    const inprogress = modifiedPlanItems.filter((item) =>
      ['Inprogress', 'Rework', 'Rejected'].includes(item.status)
    );
    const rework = modifiedPlanItems.filter((item) =>
      ['RejectedByClient', 'ReworkByClient'].includes(item.status)
    );
    const submittedToClient = modifiedPlanItems.filter(
      (item) => item.status === 'SubmitToClient'
    );
    const approved = modifiedPlanItems.filter((item) =>
      ['ApprovedByClient', 'Approved'].includes(item.status)
    );
    const scheduled = modifiedPlanItems.filter(
      (item) => item.scheduledDate != ''
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'social media planner items',
      {
        all: all,
        inprogress: inprogress,
        rework: rework,
        submittedToClient: submittedToClient,
        approved: approved,
        scheduled: scheduled,
      }
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function getSocialMediaPlanContentById(req, res, next) {
  try {
    const { planId, itemId, projectId } = req.params;
    // const project = await getFullProjectDetails(projectId);
    // if (!project) {
    //   return responseHelper(
    //     res,
    //     httpStatus.NOT_FOUND,
    //     true,
    //     'Project not found'
    //   );
    // }
    // const client = {
    //   name: `${project?.clientId?.firstName} ${project?.clientId?.lastName}`,
    //   image: project?.clientId?.clientImage?.path,
    // };
    const plan = await models.socialMediaPlannerModel
      .findOne({ _id: planId, 'items._id': itemId }, { 'items.$': 1 })
      .select('title')
      .populate({
        path: 'items.posts.images',
        model: 'Image',
      })
      .populate({ path: 'items.posts.images', select: 'path _id' })
      .populate({
        path: 'items.approval.comments.commentedBy',
        model: 'User',
        select: 'firstName lastName userImage',
      });
    if (!plan) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Content planner not found'
      );
    }
    const {
      approval: { status, comments },
      ...rest
    } = plan.items[0].toObject();
    const matchedItem = {
      status: plan.items[0].approval.status,
      comment: plan.items[0].approval.comments,
      ...rest,
    };
    return responseHelper(res, httpStatus.OK, false, 'Social media planner', {
      // client,
      post: {
        //projectId,
        ...plan.toObject(),
        items: matchedItem,
      },
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function saveSelectedContentIdeas(req, res, next) {
  try {
    const { projectId, language } = req.params;
    const { selectedIdeas } = req.body;

    const savedList = [];

    for (const ideaId of selectedIdeas) {
      const idea = await models.promptHistoryModel.findById(ideaId);

      if (!idea) {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          `Content idea with ID ${ideaId} not found.`
        );
      }

      if (String(idea.projectId) !== projectId) {
        return responseHelper(
          res,
          httpStatus.BAD_REQUEST,
          true,
          'All content ideas should be from the specified project.'
        );
      }

      idea.isSaved = true;
      idea.language = language;
      await idea.save();
      savedList.push(idea);
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Content ideas saved successfully.',
      { savedList }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function deleteGeneratedContentIdea(req, res, next) {
  try {
    const { projectId, contentId } = req.params;

    const content = await models.promptHistoryModel.findById(contentId);

    if (!content) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Content idea not found.'
      );
    }

    if (String(content.projectId) !== projectId) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Content idea should be from the specified project.'
      );
    }

    await content.deleteOne();

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Content idea is deleted successfully.'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function saveChildPost(req, res, next) {
  try {
    const { projectId, historyId } = req.params;
    const { content, title } = req.body;

    const childHistory = await models.promptHistoryModel.findById(historyId);

    if (childHistory && String(childHistory.projectId) === projectId) {
      await models.promptHistoryModel.findByIdAndUpdate(
        historyId,
        {
          response: content,
          name: title,
          isSaved: true,
        },
        { new: true }
      );

      return responseHelper(
        res,
        httpStatus.OK,
        false,
        'Child post is edited successfully',
        {}
      );
    } else {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'The history entry must belong to the specified project.'
      );
    }
  } catch (error) {
    return next(new Error(error));
  }
}

export async function deleteChildPost(req, res, next) {
  try {
    const { projectId, historyId } = req.params;

    const childHistory = await models.promptHistoryModel.findById(historyId);

    if (childHistory && String(childHistory.projectId) === projectId) {
      await models.promptHistoryModel.findByIdAndDelete(historyId);

      return responseHelper(
        res,
        httpStatus.OK,
        false,
        'Child post is deleted successfully',
        {}
      );
    } else {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'The history entry must belong to the specified project.'
      );
    }
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getAssetLists(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const image = project.clientId.clientImage.path;
    const name = `${project.clientId.firstName}  ${project.clientId.lastName}`;
    let plan = await models.socialMediaPlannerModel.find({
      projectId: projectId,
    });

    const socialMediaPlanWithItems = plan.filter((item) => item.items);
    const modifiedPlanItems = [];

    await Promise.all(
      socialMediaPlanWithItems.map(async (planItem) => {
        const postWithImageIndex = planItem.items.posts.findIndex(
          (post) => post.images && post.images.length > 0
        );
        const selectedPostIndex =
          postWithImageIndex === -1 ? 0 : postWithImageIndex;
        const scheduledDate = planItem.items.scheduledDate
          ? new Date(planItem.items.scheduledDate).toISOString().split('T')[0]
          : null;
        let planPrompt = null;
        if (planItem.items.posts[selectedPostIndex]?.parentId) {
          planPrompt = await models.promptHistoryModel.findOne({
            _id: planItem.items.posts[selectedPostIndex].parentId,
          });
        }
        modifiedPlanItems.push({
          projectId: projectId,
          title: planItem.title,
          language: planPrompt.language,
          id: planItem._id,
          key: 'social_media_post_generator',
          status: planItem.items.approval.status,
          comments: planItem.items.comments || '',
          scheduledDate: scheduledDate || '',
          post: planItem.items.posts[selectedPostIndex]?.post || '',
          platform: planItem.items.posts[selectedPostIndex]?.platform || '',
          image: planItem.items.posts[selectedPostIndex]?.images[0]?.path || '',
          itemId: planItem.items._id,
          client: {
            name,
            image,
          },
        });
      })
    );

    let campaignIdea = await models.promptHistoryModel.find({
      projectId: projectId,
      key: 'campaign_ideas',
      isSaved: true,
    });
    let campaignIdeaArray = [];
    campaignIdea.forEach((idea) => {
      let jsonData = JSON.parse(idea.response);
      campaignIdeaArray.push({
        title: jsonData.title,
        content: jsonData.content,
        language: idea.language,
        id: idea._id,
        key: idea.key,
        projectId: idea.projectId,
      });
    });
    let contentIdea = await models.promptHistoryModel.find({
      projectId: projectId,
      key: 'content_idea_generator',
      isSaved: true,
    });
    let contentIdeaArray = [];
    contentIdea.forEach((idea) => {
      let jsonData = JSON.parse(idea.response);
      contentIdeaArray.push({
        title: jsonData.title,
        content: jsonData.content,
        language: idea.language,
        id: idea._id,
        key: idea.key,
        projectId: idea.projectId,
      });
    });
    let aiImages = await models.promptHistoryModel.find({
      projectId: projectId,
      key: 'ai_generated_image',
    });
    let aIArray = [];
    aiImages.forEach((idea) => {
      const imageUrl = idea.response.match(/https:\/\/[^\s]+/)[0];
      aIArray.push({
        path: imageUrl,
        id: idea._id,
        key: idea.key,
        projectId: idea.projectId,
      });
    });

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'social media planner items',
      {
        all: [...modifiedPlanItems, ...contentIdeaArray, ...campaignIdeaArray],
        aiImages: aIArray,
        generatedContent: [...contentIdeaArray, ...campaignIdeaArray],
        socialMedia: modifiedPlanItems,
      }
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function editAssetTitle(req, res, next) {
  try {
    const { projectId, id } = req.params;
    const { title } = req.body;

    const inPlan = await models.socialMediaPlannerModel.findById(id);
    if (inPlan && String(inPlan.projectId) === projectId) {
      await models.socialMediaPlannerModel.findOneAndUpdate(
        { _id: id, projectId: projectId },
        { title: title },
        { new: true }
      );
    } else {
      const inHistory = await models.promptHistoryModel.findById(id);
      if (inHistory && String(inHistory.projectId) === projectId) {
        await models.promptHistoryModel.findOneAndUpdate(
          { _id: id, projectId: projectId },
          { name: title },
          { new: true }
        );
      } else {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'This content not found'
        );
      }
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Asset title is renamed successfully',
      {}
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}
export async function editAssetContent(req, res, next) {
  try {
    const { projectId, id } = req.params;
    const { content } = req.body;
    const { postId } = req.query;

    const inPlan = await models.socialMediaPlannerModel.findById(id);

    if (postId) {
      if (inPlan && String(inPlan.projectId) === projectId) {
        let postFound = false;

        const updatedItems = inPlan.items.posts.map((post) => {
          if (String(post._id) === postId) {
            post.post = content;
            postFound = true;
          }
          return post;
        });

        if (postFound) {
          await models.socialMediaPlannerModel.findOneAndUpdate(
            { _id: id, projectId: projectId },
            { 'items.posts': updatedItems },
            { new: true }
          );

          return responseHelper(
            res,
            httpStatus.OK,
            false,
            'Post content updated successfully',
            {}
          );
        }
      }

      const inHistory = await models.promptHistoryModel.findById(id);
      if (inHistory && String(inHistory.projectId) === projectId) {
        await models.promptHistoryModel.findOneAndUpdate(
          { _id: id, projectId: projectId },
          { response: content },
          { new: true }
        );

        return responseHelper(
          res,
          httpStatus.OK,
          false,
          'Prompt history updated successfully',
          {}
        );
      }

      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Post not found',
        null
      );
    } else {
      if (inPlan && String(inPlan.projectId) === projectId) {
        const updatedItems = inPlan.items.posts.map((post) => {
          post.post = content;
          return post;
        });

        await models.socialMediaPlannerModel.findOneAndUpdate(
          { _id: id, projectId: projectId },
          { 'items.posts': updatedItems },
          { new: true }
        );

        return responseHelper(
          res,
          httpStatus.OK,
          false,
          'All posts content updated successfully',
          {}
        );
      }

      const inHistory = await models.promptHistoryModel.findById(id);
      if (inHistory && String(inHistory.projectId) === projectId) {
        await models.promptHistoryModel.findOneAndUpdate(
          { _id: id, projectId: projectId },
          { response: content },
          { new: true }
        );

        return responseHelper(
          res,
          httpStatus.OK,
          false,
          'Prompt history updated successfully',
          {}
        );
      }

      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'This content not found',
        null
      );
    }
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function deleteAsset(req, res, next) {
  try {
    const { projectId, id } = req.params;

    const parentPlan = await models.socialMediaPlannerModel.findById(id);
    if (parentPlan && String(parentPlan.projectId) === projectId) {
      await models.socialMediaPlannerModel.findOneAndDelete({
        _id: id,
        projectId: projectId,
      });

      await models.promptHistoryModel.deleteMany({
        parentId: parentPlan.parentId,
      });
    } else {
      const parentHistory = await models.promptHistoryModel.findById(id);
      if (parentHistory && String(parentHistory.projectId) === projectId) {
        await models.promptHistoryModel.deleteMany({
          parentId: parentHistory.parentId,
        });
      } else {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'This content not found'
        );
      }
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Asset is deleted successfully',
      {}
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function getAssetListsById(req, res, next) {
  try {
    const { projectId, id } = req.params;
    const project = await getFullProjectDetails(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const image = project.clientId.clientImage.path;
    const name = `${project.clientId.firstName}  ${project.clientId.lastName}`;
    let assestData = {};
    let assetPost = await models.socialMediaPlannerModel
      .findById(id)
      .populate({ path: 'items.posts.images', select: 'path _id' })
      .populate({
        path: 'items.approval.comments.commentedBy',
        select: 'userImage firstName lastName',
      });
    if (assetPost) {
      const item = assetPost?.items;
      const {
        approval: { status, comments },
        ...rest
      } = item.toObject();
      if (!item) {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'Item not found'
        );
      }
      let planPrompt;
      const postWithImageIndex = assetPost.items.posts.findIndex(
        (post) => post.images && post.images.length > 0
      );
      const selectedPostIndex =
        postWithImageIndex === -1 ? 0 : postWithImageIndex;
      if (assetPost.items.posts[selectedPostIndex]?.parentId) {
        planPrompt = await models.promptHistoryModel.findOne({
          _id: assetPost.items.posts[selectedPostIndex].parentId,
        });
      }

      // Process posts and include childHistoryArray
      await Promise.all(
        item.posts.map(async (post) => {
          let childHistoryArray = [];
          let childHistory = await models.promptHistoryModel.find({
            parentId: post.parentId,
            isSaved: true,
          });

          childHistory.forEach((child) => {
            childHistoryArray.push({
              projectId: projectId,
              key: child.key,
              _id: child._id,
              parentId: child.parentId,
              title: child.name,
              content: child.response,
            });
          });

          post.childHistoryArray = childHistoryArray;
        })
      );

      const platformPosts = item.posts.map((post) => {
        return {
          parentId: post.parentId,
          platform: post.platform,
          images: post.images,
          post: post.post,
          _id: post._id,
          childHistories: post.childHistoryArray || [],
        };
      });

      assestData = {
        projectId: projectId,
        parentId: assetPost.parentId,
        title: assetPost.title,
        language: planPrompt.language,
        _id: assetPost._id,
        key: 'social_media_post_generator',
        status: item.approval.status,
        comments: item.approval.comments,
        platformPosts,
        ...rest,
        client: {
          name,
          image,
        },
      };
    } else {
      let assetIdea = await models.promptHistoryModel.findById(id);
      let jsonData = JSON.parse(assetIdea.response);
      assestData = {
        title: jsonData.title,
        content: jsonData.content,
        language: assetIdea.language,
        _id: assetIdea._id,
        key: assetIdea.key,
        projectId: assetIdea.projectId,
      };
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'social media planner items',
      assestData
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

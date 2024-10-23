import httpStatus from 'http-status';
import { unlinkSync } from 'fs';
import path from 'path';
import { getFullProjectDetails } from '../../utils/db-helper/get-full-project-details.helper.js';
import { responseHelper } from '../../utils/response.helper.js';
import * as models from '../../db/models/index.js';
import { generateAndSavePromptHistory } from '../../utils/db-helper/generate-and-save-prompt-history.js';
import { generateImage } from '../../utils/ai/ai-helper.js';
import {
  getClientName,
  getUserName,
  getClientUserName,
  sendNotificationsForRole,
} from '../../utils/db-helper/notification-creator.helper.js';
import {
  contentIdeaPrompt,
  contentIdeaGenerateMorePrompt,
  contentIdeaRegeneratePrompt,
  postGeneratePrompt,
  singlePostGeneratePrompt,
  imageGenerationPrompt,
  postRegeneratePrompt,
  imageIdeaRegeneratePromptV2,
  dallePromptRegeneratePrompt,
} from '../../registry/ai-prompts/index.js';
import { downloadAndSaveImage } from '../../utils/download-and-save-image.js';
import { getCurrentWorkingFolder } from '../../utils/get-current-working-folder.helper.js';

const formatContentIdeas = (ideas = []) => {
  return ideas.map((idea) => ({
    title: idea.title,
    content: idea.content,
    selected: false,
  }));
};
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
      'settings has saved successfully.'
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

    return responseHelper(res, httpStatus.OK, false, 'feed ai details.', {
      projectBrief: projectBrief,
      clientBrief: clientBrief,
      tagIdeas: tagIdeas,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function saveFeedAiDetails(req, res, next) {
  try {
    const { projectId } = req.params;
    const { projectBrief, clientBrief, tagIdeas } = req.body;
    const project = await models.projectModel.findOneAndUpdate(
      { _id: projectId },
      {
        $set: {
          projectBrief: projectBrief,
          clientBrief: clientBrief,
          tagIdeas: tagIdeas,
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

    let aiResponse;
    try {
      const prompts = await models.promptModel.findOne({
        key: 'content_ideas',
      });
      const params = contentIdeaPrompt(
        prompts?.key,
        project?.clientBrief,
        project?.projectBrief,
        language
      );

      aiResponse = await generateAndSavePromptHistory(
        prompts?.key,
        aiTool,
        params,
        userId
      );
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
      { contentIdeas: formattedContentIdeas }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function generateMoreContentIdeas(req, res, next) {
  try {
    const { projectId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { userId } = req.user;
    const { contentIdeas } = req.body;

    const project = await getFullProjectDetails(projectId);

    let aiResponse;
    try {
      const prompts = await models.promptModel.findOne({
        key: 'generate_more_content_ideas',
      });
      const params = contentIdeaGenerateMorePrompt(
        prompts?.key,
        project?.clientBrief,
        project?.projectBrief,
        contentIdeas,
        language
      );

      aiResponse = await generateAndSavePromptHistory(
        prompts?.key,
        aiTool,
        params,
        userId
      );
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
      'more content ideas generated successfully.',
      { contentIdeas: formattedContentIdeas }
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

    let aiResponse;
    try {
      const prompts = await models.promptModel.findOne({
        key: 'content_idea_regenerate',
      });

      const params = contentIdeaRegeneratePrompt(
        prompts?.key,
        project.clientId?.clientBrief,
        project.projectBrief,
        title,
        content
      );
      aiResponse = await generateAndSavePromptHistory(
        prompts?.key,
        aiTool,
        params
      );
    } catch (error) {
      return responseHelper(
        res,
        httpStatus.INTERNAL_SERVER_ERROR,
        true,
        'An error occurred while generating content ideas, please try again.'
      );
    }

    return responseHelper(res, httpStatus.CREATED, false, 'content idea', {
      contentIdea: { ...aiResponse, selected: false },
    });
  } catch (error) {
    return next(new Error(error));
  }
}

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
      const planner = await models.socialMediaPlannerModel.create({
        title: contentIdea.title,
        content: contentIdea.content,
      });
      contentPlannerIds.push({ language: 'english', plan: planner._id });
    }

    //save selected arabic content ideas
    for (let contentIdea of selectedArabicContentIdeas) {
      const planner = await models.socialMediaPlannerModel.create({
        title: contentIdea.title,
        content: contentIdea.content,
      });
      contentPlannerIds.push({ language: 'arabic', plan: planner._id });
    }
    let exist = [];
    let contentPlannerId = await models.projectModel.findById(projectId);
    let plan = contentPlannerId.contentPlanner.socialMediaPlanner;

    for (const element of plan) {
      let item = await models.socialMediaPlannerModel.findById(element.plan);
      if (item.items.length === 0) {
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

export async function getContentIdeas(req, res, next) {
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
        .select('title content');
      englishContentPlans.push(plan);
    }

    for (let planId of arabicPlannerIds) {
      const plan = await models.socialMediaPlannerModel
        .findById(planId?.plan)
        .select('title content');
      arabicContentPlans.push(plan);
    }

    return responseHelper(res, httpStatus.CREATED, false, 'content ideas', {
      englishContentIdeas: englishContentPlans,
      arabicContentIdeas: arabicContentPlans,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

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
        .select('title items');
      englishContentPlans.push(plan);
    }

    for (let planId of arabicPlannerIds) {
      const plan = await models.socialMediaPlannerModel
        .findById(planId?.plan)
        .select('title items');
      arabicContentPlans.push(plan);
    }

    const modifiedEnglishPlanItems = [];

    const processPlanItem = async (planItem) => {
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
          });
        })
      );

      modifiedEnglishPlanItems.push({
        projectId: projectId,
        title: planItem.title,
        planId: planItem._id,
        items: modifiedItems,
      });
    };

    await Promise.all(englishContentPlans?.map(processPlanItem));

    const modifiedArabicPlanItems = [];

    const processArabicPlanItem = async (planItem) => {
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
          });
        })
      );

      modifiedArabicPlanItems.push({
        projectId: projectId,
        title: planItem.title,
        planId: planItem._id,
        items: modifiedItems,
      });
    };

    await Promise.all(arabicContentPlans?.map(processArabicPlanItem));

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
        'Social media planner not found'
      );
    }

    let generatePostsAiResponse, generateImagesAndDallePromptAiResponse;
    {
      //generate posts section
      const prompts = await models.promptModel.findOne({
        key: 'generate_posts',
      });

      const params = postGeneratePrompt(
        prompts?.key,
        project?.clientBrief,
        project.projectBrief,
        //contents passing here
        [socialMediaPlanner],
        language,
        project.contentPlanner?.settings?.platforms
      );

      generatePostsAiResponse = await generateAndSavePromptHistory(
        prompts?.key,
        aiTool,
        params,
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
          userId
        );
    }

    let responseBody = {};
    if (generatePostsAiResponse)
      responseBody['posts'] = generatePostsAiResponse;
    if (generateImagesAndDallePromptAiResponse)
      responseBody = {
        ...generateImagesAndDallePromptAiResponse,
        ...responseBody,
      };

    const client = {
      name: project?.clientId?.firstName,
      image: project?.clientId?.clientImage?.path,
    };
    responseBody['client'] = client;
    responseBody['planId'] = planId;
    responseBody['_id'] = null;
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'creatives',
      responseBody
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
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
        'Social media planner not found'
      );
    }

    //generate posts section
    const prompts = await models.promptModel.findOne({
      key: 'generate_single_post',
    });

    const params = singlePostGeneratePrompt(
      prompts?.key,
      project?.clientBrief,
      project.projectBrief,
      //contents passing here
      [socialMediaPlanner],
      language,
      platform
    );

    let generatePostAiResponse = await generateAndSavePromptHistory(
      prompts?.key,
      aiTool,
      params,
      userId
    );

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
        'Social media planner not found'
      );
    }

    //generate posts section
    const prompts = await models.promptModel.findOne({
      key: 'regenerate_single_post',
    });

    const params = postRegeneratePrompt(prompts?.key, platform, post, language);

    let regeneratePostAiResponse = await generateAndSavePromptHistory(
      prompts?.key,
      aiTool,
      params,
      userId
    );

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'post regenerated successfully',
      regeneratePostAiResponse
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function regenerateImageIdeas(req, res, next) {
  try {
    const { projectId, planId, platform } = req.params;
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

    //generate posts section
    const prompts = await models.promptModel.findOne({
      key: 'image_ideas_regenerate',
    });

    const params = imageIdeaRegeneratePromptV2(
      prompts?.key,
      platform,
      language
    );

    let regenerateImageIdeasAiResponse = await generateAndSavePromptHistory(
      prompts?.key,
      aiTool,
      params,
      userId
    );

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'image ideas',
      regenerateImageIdeasAiResponse
    );
  } catch (error) {
    return next(new Error(error));
  }
}
export async function regenerateDallePrompt(req, res, next) {
  try {
    const { projectId, planId, platform } = req.params;
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

    const prompts = await models.promptModel.findOne({
      key: 'dalle_prompt_regenerate',
    });

    const params = dallePromptRegeneratePrompt(
      prompts?.key,
      dallePrompt,
      language
    );

    let regenerateDallePromptAiResponse = await generateAndSavePromptHistory(
      prompts?.key,
      aiTool,
      params,
      userId
    );

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'dalle prompt regenerated successfully',
      regenerateDallePromptAiResponse
    );
  } catch (error) {
    return next(new Error(error));
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

    const savedPlanItem =
      await models.socialMediaPlannerModel.findByIdAndUpdate(
        planId,
        {
          $push: {
            items: {
              imageIdeas,
              dallePrompt,
              posts,
            },
          },
        },
        { new: true }
      );
    //latest item
    const latestItem = savedPlanItem?.items?.[savedPlanItem?.items?.length - 1];

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'social media planner  saved successfully',
      { plan: latestItem }
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

    const socialMediaPlanner = await models.socialMediaPlannerModel
      .findById(planId)
      .populate({ path: 'items.posts.images', select: 'path _id' })
      .populate({
        path: 'items.approval.comments.commentedBy',
        select: 'userImage firstName lastName',
      });
    const item = socialMediaPlanner?.items?.find((item) => item._id == itemId);

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'social media planner item',
      { item: item }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function contentPlannerItemGenerateImage(req, res, next) {
  try {
    const { projectId, planId, itemId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
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
      response: finalResponse,
      userId,
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

    //add within content planner
    const selectedItem = socialMediaPlanner?.items.find(
      (item) => item._id == itemId
    );
    selectedItem?.dalleGeneratedImages.push({
      image: dbImage._id,
      path: imageSavedPath,
    });
    socialMediaPlanner?.save();

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'image generated successfully',
      { image: imageSavedPath }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function contentPlannerItemDeleteGeneratedImage(req, res, next) {
  try {
    const { projectId, planId, itemId, imageId } = req.params; //image id is _id of array item
    const { aiTool = 'openAi', language = 'english' } = req.query;
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

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);

    const selectedItem = socialMediaPlanner?.items.find(
      (item) => item._id == itemId
    );

    const selectedImageIndex = selectedItem?.dalleGeneratedImages.findIndex(
      (image) => image._id?.toString() === imageId
    );
    const selectedImage = selectedItem?.dalleGeneratedImages.find(
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

    selectedItem.dalleGeneratedImages.splice(selectedImageIndex, 1);
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
    const { projectId, planId, itemId, postId } = req.params;
    if ([projectId, planId, itemId, postId].includes('undefined')) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        '"projectId", "planId", "itemId", "postId" are required'
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

    const selectedItem = socialMediaPlanner?.items?.find(
      (item) => item._id == itemId
    );
    const selectedPost = selectedItem?.posts?.find(
      (post) => post._id == postId
    );

    console.log('1062 =>', selectedItem, selectedPost);
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
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'image uploaded successfully'
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function contentPlannerItemDeleteUploadImage(req, res, next) {
  try {
    const { projectId, planId, itemId, postId, imageId } = req.params;
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

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);

    const selectedItem = socialMediaPlanner?.items.find(
      (item) => item._id == itemId
    );
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
    const { projectId, planId, itemId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
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

    const selectedItem = socialMediaPlanner?.items.find(
      (item) => item._id == itemId
    );
    selectedItem?.approval?.comments.push({
      comment: comment,
      commentedBy: userId,
    });

    socialMediaPlanner?.save();

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
    const { projectId, planId, itemId, commentId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
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
    const selectedItem = socialMediaPlanner?.items.find(
      (item) => item._id == itemId
    );
    const selectedComment = selectedItem?.approval?.comments.find(
      (comment) => comment._id?.toString() === commentId
    );
    const selectedCommentIndex = selectedItem?.approval?.comments.findIndex(
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

    await models.socialMediaPlannerModel.findOneAndUpdate(
      { _id: planId, 'items._id': itemId, 'items.posts._id': posts[0]._id },
      {
        $set: {
          'items.0.posts.$.post': posts[0].post,
          'items.$.dallePrompt': dallePrompt,
          'items.$.imageIdeas': imageIdeas,
        },
      },
      { new: true }
    );

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Content Planner updated successfully.'
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
    const { projectId, planId, itemId } = req.params;
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
    let modifiedStatus;
    switch (status) {
      case 'SubmitToClient':
        modifiedStatus = 'Submit To Client';
        break;
      case 'ApprovedByClient':
        modifiedStatus = 'Approved By Client';
        break;
      default:
        modifiedStatus = status;
        break;
    }
    const creatorName = await getUserName(req.user.userId);

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);

    const selectedItem = socialMediaPlanner?.items.find(
      (item) => item._id == itemId
    );
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
    if (
      status == 'Approved' &&
      !['Rework', 'Inprogress'].includes(selectedItem.approval.status)
    ) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `Can not approve the post with status ${selectedItem.approval.status} .`
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
    let notificationContent = `${creatorName} updated the status of post '${socialMediaPlanner.title}' in project '${project.name}' to '${modifiedStatus}'.`;

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
      'post status updated successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function schedule(req, res, next) {
  try {
    const { planId, itemId, projectId } = req.params;

    // if (req.user.role != 'admin' && req.user.role != 'Project Manager') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to do this action.'
    //   );
    // }
    const project = await models.projectModel.findById(projectId);
    const creatorName = await getUserName(req.user.userId);

    const plan = await models.socialMediaPlannerModel.findOne({
      _id: planId,
      'items._id': itemId,
    });

    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'Plan not found');
    }

    const { scheduleDate } = req.body;
    const selectedItem = plan.items.find(
      (item) => item._id.toString() === itemId
    );
    if (!scheduleDate) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        `Schedule date is missing`
      );
    }
    if (!selectedItem) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Content item not found'
      );
    }

    if (
      selectedItem.approval.status !== 'ApprovedByClient' &&
      selectedItem.approval.status !== 'Approved'
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
          `Can not schedule the post with status ${selectedItem.approval.status} .`
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
      { _id: planId, 'items._id': itemId },
      {
        $set: {
          'items.$.scheduledDate': schedule,
          // 'items.$.approval.status': 'Scheduled',
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
      selectedContents.map(async ({ planId, contentId }) => {
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
            `item is not found`
          );
        }

        if (action == 'schedule') {
          const parseDateString = (dateString) => {
            const [day, month, year] = dateString.split('-');
            return `${year}-${month}-${day}T00:00:00.000Z`;
          };
          schedule = parseDateString(scheduleDate);
        }
        const selectedItemIndex = planner.items.findIndex(
          (item) => item._id.toString() === contentId
        );
        if (selectedItemIndex === -1) {
          return responseHelper(
            res,
            httpStatus.NOT_FOUND,
            true,
            `Content item not found for id: ${contentId}`
          );
        }
        titles.push(planner.title);
        let changes = {};
        switch (action) {
          case 'schedule':
            if (
              ['ApprovedByClient', 'Approved'].includes(
                planner.items[selectedItemIndex].approval.status
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
                planner.items[selectedItemIndex].approval.status
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
              ].includes(planner.items[selectedItemIndex].approval.status)
            ) {
              changes = { approvalStatus: 'Rework' };
            } else {
              allConditionsSatisfied = false;
            }
            break;

          case 'submitToClient':
            if (
              planner.items[selectedItemIndex].approval.status === 'Approved'
            ) {
              changes = { approvalStatus: 'SubmitToClient' };
            } else {
              allConditionsSatisfied = false;
            }
            break;

          case 'approve':
            if (
              ['Inprogress', 'Rework'].includes(
                planner.items[selectedItemIndex].approval.status
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
          contentId: contentId,
          scheduledDate: changes.scheduledDate,
          approvalStatus: changes.approvalStatus,
        });
      })
    );

    if (allConditionsSatisfied) {
      for (const {
        planId,
        contentId,
        scheduledDate,
        approvalStatus,
      } of changesForItems) {
        await models.socialMediaPlannerModel.findOneAndUpdate(
          { _id: planId, 'items._id': contentId },
          {
            $set: {
              'items.$.scheduledDate': scheduledDate,
              'items.$.approval.status': approvalStatus,
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
    const { planId, itemId } = req.params;
    const plan = await models.socialMediaPlannerModel
      .findOne({ _id: planId, 'items._id': itemId }, { 'items.$': 1 })
      .select('title')
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
    const matchedItem = plan.items[0];

    return responseHelper(res, httpStatus.OK, false, 'Social media planner', {
      post: { ...plan.toObject(), items: matchedItem },
    });
  } catch (error) {
    return next(new Error(error));
  }
}

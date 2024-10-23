import httpStatus from 'http-status';
import path from 'path';
import { responseHelper } from '../utils/response.helper.js';
import * as models from '../db/models/index.js';
import {
  tagIdeaGeneratePrompt,
  contentIdeaPrompt,
  contentIdeaGenerateMorePrompt,
  contentIdeaRegeneratePrompt,
  generatePostsPrompt,
  imageGenerationPrompt,
  postGeneratePrompt,
  singlePostGeneratePrompt,
  imageIdeaRegeneratePromptV2,
  dallePromptRegeneratePrompt,
} from '../registry/ai-prompts/index.js';
import { generateImage } from '../utils/ai/ai-helper.js';
import { generateAndSavePromptHistory } from '../utils/db-helper/generate-and-save-prompt-history.js';
import { getCurrentWorkingFolder } from '../utils/get-current-working-folder.helper.js';
import { downloadAndSaveImage } from '../utils/download-and-save-image.js';
const formatContentIdeas = (ideas = []) => {
  return ideas.map((idea) => ({
    title: idea.title,
    content: idea.content,
    selected: false,
  }));
};
export async function findAllProjects(req, res, next) {
  try {
    const { search } = req.query;
    const projects = await models.projectModel
      .find({ name: { $regex: new RegExp(search, 'i') } })
      .select('name');

    return responseHelper(res, httpStatus.OK, false, 'projects', {
      projects,
    });
  } catch (error) {
    return next(new Error(error));
  }
}
export async function getProjectSettings(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await models.projectModel.findById(projectId);
    const settings = project?.contentPlanner?.settings;
    const projectBrief = project?.projectBrief;
    const tagIdeas = project?.tagIdeas;
    return responseHelper(res, httpStatus.OK, false, 'settings', {
      settings: settings,
      projectBrief: projectBrief,
      tagIdeas,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function generateTagIdeas(req, res, next) {
  try {
    const { aiTool = 'openAi' } = req.query;
    const { productServiceName, description } = req.body;
    const { userId } = req.user;

    //generate posts section
    const prompts = await models.promptModel.findOne({
      key: 'generate_tag_ideas',
    });

    const params = tagIdeaGeneratePrompt(
      prompts?.key,
      productServiceName,
      description
    );

    let generateTagIdeasAiResponse = await generateAndSavePromptHistory(
      prompts?.key,
      aiTool,
      params,
      userId
    );
    const finalPrompt = `${prompts?.information} ${prompts?.instruction} ${params}`;
    generateTagIdeasAiResponse['finalPrompt'] = finalPrompt;
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'tag ideas generated successfully',
      generateTagIdeasAiResponse
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function saveSettings(req, res, next) {
  try {
    const {
      settings,
      adGoals,
      toneOfVoice,
      targetAudience,
      productServiceName,
      briefDescription,
      tagIdeas,
    } = req.body;

    const plan = await models.singleSocialMediaPlanModel.create({
      settings: settings,
      feedAiDetails: {
        adGoals: adGoals,
        toneOfVoice: toneOfVoice,
        targetAudience: targetAudience,
        productOrService: productServiceName,
        briefDescription: briefDescription,
        tagIdeas: tagIdeas,
      },
    });

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'settings has saved successfully',
      {
        planId: plan._id,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function generateContentIdeas(req, res, next) {
  try {
    const { planId } = req.params;
    const { aiTool, language } = req.query;
    const { userId } = req.user;
    const plan = await models.singleSocialMediaPlanModel
      .findById(planId)
      .populate('feedAiDetails.adGoals')
      .populate('feedAiDetails.toneOfVoice');
    let aiResponse, finalPrompt;
    try {
      const prompts = await models.promptModel.findOne({
        key: 'content_ideas',
      });
      const params = contentIdeaPrompt(
        prompts?.key,
        null,
        plan?.feedAiDetails,
        language
      );

      aiResponse = await generateAndSavePromptHistory(
        prompts?.key,
        aiTool,
        params,
        userId
      );
      finalPrompt = `${prompts?.information} ${prompts?.instruction} ${params}`;
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
      httpStatus.CREATED,
      false,
      'content ideas generated successfully',
      { finalPrompt, contentIdeas: formattedContentIdeas }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function generateMoreContentIdeas(req, res, next) {
  try {
    const { planId } = req.params;
    const { aiTool, language } = req.query;
    const { userId } = req.user;
    const { content, title } = req.body;
    const plan = await models.singleSocialMediaPlanModel
      .findById(planId)
      .populate('feedAiDetails.adGoals')
      .populate('feedAiDetails.toneOfVoice');
    let aiResponse, finalPrompt;
    try {
      const prompts = await models.promptModel.findOne({
        key: 'content_idea_regenerate',
      });
      const params = contentIdeaRegeneratePrompt(
        prompts?.key,
        null,
        plan?.feedAiDetails,
        contentIdeas,
        title,
        content
      );

      aiResponse = await generateAndSavePromptHistory(
        prompts?.key,
        aiTool,
        params,
        userId
      );
      finalPrompt = `${prompts?.information} ${prompts?.instruction} ${params}`;
    } catch (error) {
      return responseHelper(
        res,
        httpStatus.INTERNAL_SERVER_ERROR,
        true,
        'An error occurred while generating content ideas, please try again.'
      );
    }

    aiResponse.selected = false;
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'content idea regenerated successfully',
      {
        finalPrompt,
        contentIdea: aiResponse,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function regenerateContentIdea(req, res, next) {
  try {
    const { planId } = req.params;
    const { aiTool, language } = req.query;
    const { userId } = req.user;
    const { contentIdeas } = req.body;
    const plan = await models.singleSocialMediaPlanModel
      .findById(planId)
      .populate('feedAiDetails.adGoals')
      .populate('feedAiDetails.toneOfVoice');
    let aiResponse, finalPrompt;
    try {
      const prompts = await models.promptModel.findOne({
        key: 'content_idea_regenerate',
      });

      const params = contentIdeaRegeneratePrompt(
        prompts?.key,
        null,
        plan?.feedAiDetails,
        contentIdeas,
        language
      );

      aiResponse = await generateAndSavePromptHistory(
        prompts?.key,
        aiTool,
        params,
        userId
      );
      finalPrompt = `${prompts?.information} ${prompts?.instruction} ${params}`;
    } catch (error) {
      return responseHelper(
        res,
        httpStatus.INTERNAL_SERVER_ERROR,
        true,
        'An error occurred while generating content ideas, please try again.'
      );
    }

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'content ideas regenerated successfully',
      {
        finalPrompt,
        contentIdea: aiResponse,
      }
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function saveContentIdeas(req, res, next) {
  try {
    const { planId } = req.params;
    const { arabicContentIdeas, englishContentIdeas } = req.body;

    const plan = await models.singleSocialMediaPlanModel.findById(planId);
    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'plan not found');
    }

    plan.contentIdeas.arabic = arabicContentIdeas;
    plan.contentIdeas.english = englishContentIdeas;
    await plan.save();

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'content ideas saved successfully'
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function getContentIdeas(req, res, next) {
  try {
    const plan = await models.singleSocialMediaPlanModel.findById(
      req.params.planId
    );
    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'plan not found');
    }
    return responseHelper(res, httpStatus.OK, false, 'content ideas', {
      contentIdeas: plan.contentIdeas,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function generatePlan(req, res, next) {
  try {
    const { planId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { userId } = req.user;

    const plan = await models.singleSocialMediaPlanModel.findById(planId);
    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'plan not found');
    }

    let generatePostsAiResponse,
      generateImagesAndDallePromptAiResponse,
      finalPrompt;
    {
      //generate posts section
      const prompts = await models.promptModel.findOne({
        key: 'generate_posts',
      });

      const params = postGeneratePrompt(
        prompts?.key,
        null,
        plan.feedAiDetails,
        [plan.contentIdeas],
        language,
        plan.settings?.socialMediaPlatforms
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
      finalPrompt = `${prompts?.information} ${prompts?.instruction} ${params}`;
    }

    let responseBody = {};
    if (generatePostsAiResponse)
      responseBody['posts'] = generatePostsAiResponse;
    if (generateImagesAndDallePromptAiResponse)
      responseBody = {
        ...generateImagesAndDallePromptAiResponse,
        ...responseBody,
      };
    responseBody['finalPrompt'] = finalPrompt;
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'content plan generated successfully',
      responseBody
    );
  } catch (error) {
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      'An error occurred while generating content plan, please try again.'
    );
    // return next(new Error(error));
  }
}

export async function generateAiImage(req, res, next) {
  try {
    const { userId } = req.user;
    const { dallePrompt } = req.body;
    const { planId } = req.params;

    const plan = await models.singleSocialMediaPlanModel.findById(planId);
    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'plan not found');
    }

    const fileSavePath = path.join(
      getCurrentWorkingFolder(import.meta.url),
      '../../public/uploads/images'
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

    plan.aiGeneratedImages.push({
      image: dbImage._id,
      path: imageSavedPath,
    });
    await plan.save();

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'image generated successfully',
      { image: imageSavedPath }
    );
  } catch (error) {
    console.log(error);
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      'An error occurred while generating image, please try again.'
    );
    // return next(new Error(error));
  }
}

export async function removeGeneratedImage(req, res, next) {
  try {
    const { planId, imageId } = req.params;

    const plan = await models.singleSocialMediaPlanModel.findById(planId);
    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'plan not found');
    }

    const imageIndex = plan.aiGeneratedImages.findIndex(
      (image) => image?.image?.toString() === imageId
    );

    if (imageIndex === -1) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'image not found');
    }
    plan.aiGeneratedImages.splice(imageIndex, 1);
    await plan.save();

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

export async function regenerateImageIdea(req, res, next) {
  try {
    const { planId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { userId } = req.user;
    const { imageIdeas } = req.body;
    const plan = await models.singleSocialMediaPlanModel.findById(planId);
    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'plan not found');
    }

    //generate posts section
    const prompts = await models.promptModel.findOne({
      key: 'image_ideas_regenerate',
    });

    const params = imageIdeaRegeneratePromptV2(
      prompts?.key,
      imageIdeas,
      language
    );

    let regenerateImageIdeasAiResponse = await generateAndSavePromptHistory(
      prompts?.key,
      aiTool,
      params,
      userId
    );
    const finalPrompt = `${prompts?.information} ${prompts?.instruction} ${params}`;
    regenerateImageIdeasAiResponse['finalPrompt'] = finalPrompt;
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'image ideas regenerated successfully',
      regenerateImageIdeasAiResponse
    );
  } catch (error) {
    console.log(error);
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      'An error occurred while generating image ideas, please try again.'
    );
    //  return next(new Error(error));
  }
}

export async function regenerateDallePrompt(req, res, next) {
  try {
    const { planId } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { userId } = req.user;
    const { dallePrompt } = req.body;
    const plan = await models.singleSocialMediaPlanModel.findById(planId);
    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'plan not found');
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
    const finalPrompt = `${prompts?.information} ${prompts?.instruction} ${params}`;
    regenerateDallePromptAiResponse['finalPrompt'] = finalPrompt;
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'dalle prompt regenerated successfully',
      regenerateDallePromptAiResponse
    );
  } catch (error) {
    console.log(error);
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      'An error occurred while generating dalle prompt, please try again.'
    );
    //return next(new Error(error));
  }
}

export async function addMoreMost(req, res, next) {
  try {
    const { planId, platform } = req.params;
    const { aiTool = 'openAi', language = 'english' } = req.query;
    const { userId } = req.user;
    const plan = await models.singleSocialMediaPlanModel
      .findById(planId)
      .populate('feedAiDetails.adGoals')
      .populate('feedAiDetails.toneOfVoice');
    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'plan not found');
    }

    const prompts = await models.promptModel.findOne({
      key: 'generate_single_post',
    });

    const params = singlePostGeneratePrompt(
      prompts?.key,
      null,
      plan.feedAiDetails,
      //contents passing here
      [plan.contentIdeas],
      language,
      platform
    );

    let generatePostAiResponse = await generateAndSavePromptHistory(
      prompts?.key,
      aiTool,
      params,
      userId
    );
    const finalPrompt = `${prompts?.information} ${prompts?.instruction} ${params}`;
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
export async function savePlan(req, res, next) {
  try {
    const { planId } = req.params;
    const plan = await models.singleSocialMediaPlanModel.findById(planId);
    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'Plan not found');
    }

    const { imageIdeas, dallePrompt, posts } = req.body;

    plan.imageIdeas = imageIdeas;
    plan.dallePrompt = dallePrompt;

    // Iterate over each post from the request body
    posts.forEach((newPost) => {
      // Find the index of the post in the plan.posts array with the same platform as the new post
      const existingPostIndex = plan.posts.findIndex(
        (post) => post.platform === newPost.platform
      );

      // If a post with the same platform exists, replace its content, otherwise push the new post
      if (existingPostIndex !== -1) {
        plan.posts[existingPostIndex] = newPost;
      } else {
        plan.posts.push(newPost);
      }
    });

    // Save the updated plan
    await plan.save();

    // Fetch the updated plan after saving
    const updatedPlan =
      await models.singleSocialMediaPlanModel.findById(planId);

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Plan saved successfully',
      {
        updatedPlan: updatedPlan,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function uploadImage(req, res, next) {
  try {
    const { planId, postId } = req.params;
    const plan = await models.singleSocialMediaPlanModel.findById(planId);
    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'plan not found');
    }

    const image = req.files.image;
    const selectedPost = plan.posts.find(
      (post) => post._id.toString() === postId
    );
    if (!selectedPost) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'post is not exists'
      );
    }
    const DBimage = await models.imageModel.create({
      name: image.originalname,
      fileName: image.filename,
      path: '/cdn/uploads/images/' + image.filename,
    });
    selectedPost?.images.push(DBimage._id);
    await plan.save();

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      `successfully uploaded the image for the ${selectedPost.platform} post.`
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function removeUploadedImage(req, res, next) {
  try {
    const { planId, postId, imageId } = req.params;
    const plan = await models.singleSocialMediaPlanModel.findById(planId);
    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'plan not found');
    }

    const selectedPost = plan.posts.find(
      (post) => post._id.toString() === postId
    );
    if (!selectedPost) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'post is not exists'
      );
    }

    const imageIndex = selectedPost.images.findIndex(
      (image) => image._id.toString() === imageId
    );
    if (imageIndex < 0) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'image is not exists'
      );
    }

    await models.imageModel.findByIdAndDelete(imageId);
    selectedPost.images.splice(imageIndex, 1);
    await plan.save();
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'image is removed successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getPlans(req, res, next) {
  try {
    const plans = await models.singleSocialMediaPlanModel.find({});
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'plans fetched successfully',
      {
        plans: plans,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getPlan(req, res, next) {
  try {
    const { planId } = req.params;
    const plan = await models.singleSocialMediaPlanModel.findById(planId);
    if (!plan) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'plan not found');
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'plan fetched successfully',
      {
        plan: plan,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

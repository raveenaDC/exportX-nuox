import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
import * as models from '../db/models/index.js';
import { generateImage } from '../utils/ai/ai-helper.js';
import { getCurrentWorkingFolder } from '../utils/get-current-working-folder.helper.js';
import { downloadAndSaveImage } from '../utils/download-and-save-image.js';
import path from 'path';

export async function getBrandInfoColorCodes(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = await models.projectModel.findById(projectId).populate({
      path: 'clientId',
      select: 'brandColorCode subheadingColorCode descriptionColorCode',
    });

    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const brandColorCodes = {
      mainBrandColorCode: project.clientId.brandColorCode,
      subheadingColorCode: project.clientId.subheadingColorCode,
      descriptionColorCode: project.clientId.descriptionColorCode,
    };

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Brand information color codes fetched successfully',
      brandColorCodes
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}
export async function getAllBrandPatterns(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = await models.projectModel.findById(projectId).populate({
      path: 'clientId',
      select: 'brandKit',
    });

    if (!project || !project.clientId) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project or associated client not found'
      );
    }

    const brandPatterns = project.clientId.brandKit.brandPattern;

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Brand patterns fetched successfully',
      brandPatterns
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function getAllTemplates(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = await models.projectModel.findById(projectId).populate({
      path: 'clientId',
      select: 'template templates',
    });

    if (!project || !project.clientId) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project or associated client not found'
      );
    }
    const template = project.clientId.template;
    const templates = project.clientId.templates.sort(
      (a, b) =>
        new Date(b.template.uploadedDate) - new Date(a.template.uploadedDate)
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Templates fetched successfully',
      { templates: template, imageTemplates: templates }
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function getBrandWaterMarkandLogoImages(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = await models.projectModel.findById(projectId).populate({
      path: 'clientId',
      select: 'waterMarkImage logoImage',
    });

    if (!project || !project.clientId) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project or associated client not found'
      );
    }

    const { waterMarkImage, logoImage } = project.clientId;

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Watermark and logo images fetched successfully',
      {
        waterMarkImage,
        logoImage,
      }
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function generatePosterBackgroundImages(req, res, next) {
  try {
    const { prompt } = req.body;
    const { userId } = req.user;

    const fileSavePath = path.join(
      getCurrentWorkingFolder(import.meta.url),
      '../../public/uploads/images'
    );
    const imageGenerationResponse = await generateImage(prompt);

    const finalResponse =
      imageGenerationResponse.data && imageGenerationResponse.data.length > 0
        ? `${imageGenerationResponse.data[0].revised_prompt} /n/n image=> ${imageGenerationResponse.data[0].url}`
        : 'image generation error';
    //save history
    await models.promptHistoryModel.create({
      finalPrompt: prompt,
      response: finalResponse,
      userId,
    });

    //save image locally
    const imageSaveResponse = await downloadAndSaveImage(
      imageGenerationResponse.data[0].url,
      fileSavePath
    );

    const imageSavedPath = '/cdn/uploads/images/' + imageSaveResponse.fileName;
    //add image under projects
    const dbImage = await models.imageModel.create({
      fileName: imageSaveResponse.fileName,
      name: imageSaveResponse.fileName,
      path: imageSavedPath,
    });

    return responseHelper(
      res,
      httpStatus.OK,
      true,
      'image generated successfully',
      dbImage
    );
  } catch (error) {
    return responseHelper(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      true,
      'An error occurred while generating image, please try again.'
    );
    // return next(new Error(error));
  }
}

export async function getProjectDocuments(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'project not found'
      );
    }

    const { documents, images } = project;

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Project documents retrieved successfully',
      {
        documents,
        images,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function saveTemplates(req, res, next) {
  try {
    const { projectId } = req.params;
    const { emptyTemplate } = req.body;
    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'project not found'
      );
    }
    const client = await models.clientModel.findById({ _id: project.clientId });
    if (!client) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'client not found'
      );
    }

    client.template.push(emptyTemplate);

    await client.save();
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Template is saved successfully',
      {}
    );
  } catch (error) {
    return next(new Error(error));
  }
}

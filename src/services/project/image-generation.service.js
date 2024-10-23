import httpStatus from 'http-status';
import { responseHelper } from '../../utils/response.helper.js';
import * as models from '../../db/models/index.js';
import { generateImage } from '../../utils/ai/ai-helper.js';
import { getCurrentWorkingFolder } from '../../utils/get-current-working-folder.helper.js';
import { downloadAndSaveImage } from '../../utils/download-and-save-image.js';
import path from 'path';
import { unlinkSync } from 'fs';
export async function generateNewImage(req, res, next) {
  try {
    const { projectId } = req.params;
    const { dallePrompt } = req.body;
    const { userId } = req.user;
    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const fileSavePath = path.join(
      getCurrentWorkingFolder(import.meta.url),
      '../../../public/uploads/images'
    );
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

    //add along with project
    await models.projectModel.findByIdAndUpdate(projectId, {
      $push: {
        'contentPlanner.dalleGeneratedImages': {
          image: dbImage._id,
          path: imageSavedPath,
        },
      },
    });

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'image generated successfully',
      { image: imageSavedPath, id: dbImage._id }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function removeImage(req, res, next) {
  try {
    const { projectId, imageId } = req.params;

    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    //remove image locally
    const selectedImage = project.contentPlanner.dalleGeneratedImages.find(
      (image) => image.image.toString() === imageId
    );
    if (selectedImage == undefined)
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Image not found',
        {}
      );
    const fullImagePath = path
      .join(
        getCurrentWorkingFolder(import.meta.url),
        `../../../public${selectedImage.path}`
      )
      .replace(/[]/g, '')
      .replace(/cdn/, '');
    await unlinkSync(fullImagePath);

    // remove image from db
    await models.imageModel.findByIdAndDelete(imageId);
    await models.projectModel.findByIdAndUpdate(projectId, {
      $pull: {
        'contentPlanner.dalleGeneratedImages': {
          image: imageId,
        },
      },
    });

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

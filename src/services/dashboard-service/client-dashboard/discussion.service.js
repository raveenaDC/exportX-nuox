import httpStatus from 'http-status';
import dateFns from 'date-fns';
import { responseHelper } from '../../../utils/response.helper.js';
import * as models from '../../../db/models/index.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

/**
 * @body {String} message
 * @params {String} projectId
 * @returns {Object} discussion
 */

export async function createDiscussion(req, res, next) {
  try {
    const { message } = req.body;
    const { projectId } = req.params;

    const projectCheck = await models.projectModel.findById(projectId);
    if (!projectCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'project not found'
      );
    }

    await models.projectModel.findByIdAndUpdate(
      projectId,
      {
        $push: {
          discuss: {
            message,
            userId: req.user.userId,
            date: new Date(),
            time: dateFns.format(new Date(), 'hh:mm a'),
          },
        }, //change userId to id from access token
      },
      { new: true }
    );

    const updatedProject = await models.projectModel
      .findById(projectId)
      .populate({
        path: 'discuss.userId',
        select: 'userImage firstName lastName',
      });

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'new message added successfully',
      { messages: updatedProject.discuss }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @body {String} message
 * @params {String} projectId
 * @params {String} discussionId
 * @returns {Object} discussion
 */
export async function updateDiscussion(req, res, next) {
  try {
    const { message } = req.body;
    const { projectId, discussionId } = req.params;

    const projectCheck = await models.projectModel.findById(projectId);
    if (!projectCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'project not found'
      );
    }

    await models.projectModel.findOneAndUpdate(
      {
        _id: projectId,
        'discuss._id': discussionId,
      },
      {
        $set: {
          'discuss.$.message': message,
          'discuss.$.date': new Date(),
          'discuss.$.time': dateFns.format(new Date(), 'hh:mm a'),
        },
      },
      { new: true }
    );

    const updatedProject = await models.projectModel
      .findById(projectId)
      .populate({
        path: 'discuss.userId',
        select: 'userImage firstName lastName',
      });

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Message updated successfully',
      {}
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @params {String} projectId
 * @returns {Object} discussions
 */
export async function getDiscussions(req, res, next) {
  try {
    const { projectId } = req.params;
    const { userId, clientId, clientUserId } = req.user;
    const { search } = req.query;

    const projectCheck = await models.projectModel.findById(projectId);

    if (!projectCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'project not found'
      );
    }
    //  let filteredDiscussions = projectCheck.discuss;
    let filteredDiscussions = [];
    for (const message of projectCheck.discuss) {
      let user = await models.userModel.findById(message.userId);
      let clientUser = await models.clientUserModel.findById(message.userId);
      let client = await models.clientModel.findById(message.userId);

      const isSelf =
        message.userId.toString() === userId?.toString() ||
        message.userId.toString() === clientId?.toString() ||
        message.userId.toString() === clientUserId?.toString();

      let image, firstName, lastName;
      if (user) {
        (image = user.userImage),
          (firstName = user.firstName),
          (lastName = user.lastName);
      } else if (client) {
        (image = client.clientImage),
          (firstName = client.firstName),
          (lastName = client.lastName);
      } else if (clientUser) {
        image = clientUser.clientUserImage;
        var name = clientUser.clientUserName.split(' ');
        firstName = name[0];
        lastName = name.slice(1).join(' ');
      }
      // Structure the message object with nested user information
      const formattedMessage = {
        userId: {
          userImage: image,
          _id: message.userId,
          firstName: firstName,
          lastName: lastName,
        },
        message: message.message,
        date: message.date,
        time: message.time,
        _id: message._id,
        isSelf,
      };
      // Return the message object with the user information and isSelf field added
      filteredDiscussions.push(formattedMessage);
    }

    if (search) {
      filteredDiscussions = filteredDiscussions.filter((discussion) => {
        return discussion.message
          ?.toLocaleLowerCase()
          .includes(search.toLowerCase());
      });
    }
    return responseHelper(res, httpStatus.OK, false, 'discussions', {
      messages: filteredDiscussions,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @params {String} projectId
 * @params {String} discussionId
 * @returns {Object} discussion
 */
export async function getDiscussionById(req, res, next) {
  try {
    const { projectId, discussionId } = req.params;
    const project = await models.projectModel.findOne(
      {
        _id: projectId,
        discuss: { $elemMatch: { _id: discussionId } },
      },
      { 'discuss.$': 1 }
    );

    return responseHelper(res, httpStatus.OK, false, 'discussion', {
      discuss: !project ? null : project.discuss[0],
    });
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @params {String} projectId
 * @params {String} discussionId
 * @returns {Null}
 */
export async function removeDiscussion(req, res, next) {
  try {
    const { projectId, discussionId } = req.params;
    const project = await models.projectModel.findById(projectId);

    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const discussion = project.discuss.find(
      (discussion) => discussion._id == discussionId
    );

    if (!discussion) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Discussion not found'
      );
    }
    const message = discussion.message;
    const imgRegex =
      /<img.*?src="[^"]*\/cdn\/uploads\/discussions\/([^"]+\.(?:jpg|jpeg|png))".*?>/g;
    let match;
    const imageFilenames = [];

    while ((match = imgRegex.exec(message)) !== null) {
      const filename = match[1];
      imageFilenames.push(filename);
    }

    await models.imageModel.deleteMany({ fileName: { $in: imageFilenames } });

    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const uploadsDir = path.join(
      currentDir,
      '../../../public/uploads/discussions'
    );
    imageFilenames.forEach((filename) => {
      const imagePath = path.join(uploadsDir, filename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    await models.projectModel.findByIdAndUpdate(
      projectId,
      { $pull: { discuss: { _id: discussionId } } },
      { new: true }
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Discussion removed successfully',
      {}
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @params {String} projectId
 * @returns {Object} discussion
 */

// export async function discussionImageUpload(req, res, next) {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(httpStatus.BAD_REQUEST).json({
//         status: httpStatus.BAD_REQUEST,
//         isError: true,
//         message: 'No files were uploaded',
//       });
//     }

//     const { discussionImage } = req.files;
//     const imagePaths = [];

//     for (const file of discussionImage) {
//       const newImage = await models.imageModel.create({
//         name: file.originalname,
//         fileName: file.filename,
//         path: '/cdn/uploads/discussions/' + file.filename,
//         uploadedDate: new Date(),
//       });

//       imagePaths.push(newImage.path);
//     }

//     return res.status(httpStatus.CREATED).json({
//       status: httpStatus.CREATED,
//       isError: false,
//       message: 'Image uploaded successfully',
//       data: { images: imagePaths },
//     });
//   } catch (error) {
//     return next(error);
//   }
// }

import httpStatus from 'http-status';
import dateFns from 'date-fns';
import { responseHelper } from '../../utils/response.helper.js';
import * as models from '../../db/models/index.js';
import { removeMulterFiles } from '../../utils/fs.helper.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { getCurrentWorkingFolder } from '../../utils/get-current-working-folder.helper.js';
const BACKEND_URL = process.env.BACKEND_URL;
import { contentIdeaPrompt } from '../../registry/ai-prompts/content-idea.prompt.js';
import moment from 'moment-timezone';
/**
 * @body {String} message
 * @params {String} projectId
 * @returns {Object} discussion
 */

export async function createDiscussion(req, res, next) {
  try {
    const { message, time } = req.body;
    const { projectId } = req.params;
    const { userId, clientUserId, clientId } = req.user;
    let user;
    if (userId) {
      user = userId;
    } else if (clientId) {
      user = clientId;
    } else if (clientUserId) {
      user = clientUserId;
    }
    const projectCheck = await models.projectModel.findById(projectId);
    if (!projectCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'project not found'
      );
    }
    const serverTime = moment();
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userLocalTime = serverTime.tz(userTimeZone);
    const formattedTime = userLocalTime.format('h:mm A');

    await models.projectModel.findByIdAndUpdate(
      projectId,
      {
        $push: {
          discuss: {
            message,
            userId: user,
            date: new Date(),
            time: formattedTime,
            //time
          },
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
      'new message is sent successfully',
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
      { messages: updatedProject }
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
        message.userId?.toString() === userId?.toString() ||
        message.userId?.toString() === clientId?.toString() ||
        message.userId?.toString() === clientUserId?.toString();

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
export async function getDiscussion(req, res, next) {
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
      'message removed successfully',
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

export async function discussionImageUpload(req, res, next) {
  try {
    const { uploadImage } = req.files;

    const newImage = await models.imageModel.create({
      name: uploadImage[0].originalname,
      fileName: uploadImage[0].filename,
      path: BACKEND_URL + '/cdn/uploads/discussions/' + uploadImage[0].filename,
      uploadedDate: new Date(),
    });

    return res.status(httpStatus.CREATED).json({
      status: httpStatus.CREATED,
      isError: false,
      message: 'Image uploaded successfully',
      data: { image: newImage.path },
    });
  } catch (error) {
    return next(error);
  }
}

export async function discussionVideoUpload(req, res, next) {
  try {
    const { video } = req.files;

    const uploadedVideo = await models.imageModel.create({
      name: video[0].originalname,
      fileName: video[0].filename,
      path: BACKEND_URL + '/cdn/uploads/videos/' + video[0].filename,
      uploadedDate: new Date(),
    });

    return res.status(httpStatus.CREATED).json({
      status: httpStatus.CREATED,
      isError: false,
      message: 'Video uploaded successfully',
      data: { video: uploadedVideo.path },
    });
  } catch (error) {
    return next(error);
  }
}

export async function mentionUsers(req, res, next) {
  try {
    const { projectId } = req.params;
    const { q, search } = req.query;

    const project = await models.projectModel
      .findById(projectId)
      .populate('clientId', '_id firstName lastName clientImage')
      .populate({
        path: 'projectCoordinators.projectCoordinator',
        model: 'User',
        select: '_id firstName lastName userImage',
      })
      .populate({
        path: 'clientUsers.clientUser',
        model: 'ClientUser',
        select: '_id clientUserName clientUserImage',
      })
      .populate({
        path: 'owner',
        model: 'ClientUser',
        select: '_id clientUserName clientUserImage roleId',
      });

    let projectMembers = [];

    const { clientId, projectCoordinators, clientUsers, owner } = project;

    const projectOwner = {
      _id: owner?._id,
      name: owner?.clientUserName,
      profile: owner?.clientUserImage?.path,
      roleId: owner?.roleId,
    };

    if (projectOwner.roleId) {
      const role = await models.roleModel.findById(projectOwner.roleId);
      if (role.roleName !== 'client') {
        projectMembers.push({
          _id: projectOwner?._id,
          name: projectOwner?.name,
          profile: projectOwner?.profile,
        });
      }
    }

    if (q === '@') {
      projectMembers = [
        {
          _id: clientId?._id,
          name: `${clientId?.firstName} ${clientId?.lastName}`,
          profile: clientId?.clientImage?.path,
        },
        ...projectCoordinators.map((coordinator) => ({
          _id: coordinator?.projectCoordinator?._id,
          name: `${coordinator?.projectCoordinator?.firstName} ${coordinator.projectCoordinator?.lastName}`,
          profile: coordinator?.projectCoordinator?.userImage?.path,
        })),
        ...clientUsers
          .filter((user) => user?.clientUser !== owner?._id)
          .filter((user) => user?.clientUser !== clientId?._id)
          .map((user) => ({
            _id: user?._id,
            name: user?.clientUserName,
            profile: user?.clientUserImage?.path,
          })),
      ]
        .filter((member) => member.name !== undefined && member.name !== null)
        .sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        projectMembers = projectMembers.filter((member) => {
          return searchRegex.test(member.name);
        });
      }
    } else {
      projectMembers = [];
    }

    return res.status(200).json({ projectMembers });
  } catch (error) {
    return next(new Error(error));
  }
}

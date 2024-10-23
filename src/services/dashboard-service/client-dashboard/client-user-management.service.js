import httpStatus from 'http-status';
import { responseHelper } from '../../../utils/response.helper.js';
import * as models from '../../../db/models/index.js';
import {
  getClientName,
  getUserName,
  getClientUserName,
  sendClientNotificationsForRole,
} from '../../../utils/db-helper/notification-creator.helper.js';
const defaultPageLimit = process.env.PAGE_LIMIT;
/**
 * @returns {Array} project client user
 */
export async function findProjectById(req, res, next) {
  try {
    const { projectId } = req.params;

    let projects = await models.projectModel
      .findById(projectId)
      .select('clientUsers')
      .populate({
        path: 'clientUsers.clientUser',
        select:
          '_id clientUserName clientUserEmail clientUserImage view action',
      })
      .lean() // Use lean() to get plain JavaScript objects instead of Mongoose documents
      .exec();

    if (!projects) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found',
        {}
      );
    }

    // Rename _id to projectId for display
    projects.projectId = projects._id;
    delete projects._id;
    projects.clientUsers.forEach((element) => {
      element.clientUser.clientUserId = element.clientUser._id;
      delete element.clientUser._id;
    });
    const projectData = {
      projectId: projects.projectId,
      clientUsers: projects.clientUsers,
    };

    return responseHelper(res, httpStatus.OK, false, 'Projects data', {
      clientUsersData: projectData,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function addClientUser(req, res, next) {
  try {
    const { user } = req.body;
    const { projectId } = req.params;
    const creatorName = await getClientName(req.user.clientId);
    const clientUserName = await getClientUserName(user);
    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const existingClientUser = await models.clientUserModel.findById(user);
    if (!existingClientUser) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client user not found'
      );
    }
    const checkUserExists = await models.projectModel.findOne({
      _id: projectId,
      'clientUsers.clientUser': user,
    });

    if (checkUserExists) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'User already present in this project'
      );
    }

    await models.projectModel.findOneAndUpdate(
      { _id: projectId },
      {
        $push: {
          clientUsers: {
            clientUser: user,
            isClientCoordinator: false,
          },
        },
      },
      { new: true }
    );
    const notificationContent = `${creatorName} has assigned ${clientUserName} for the project '${project.name}'.`;

    await models.notificationModel.create({
      content: notificationContent,
      createdByClient: req.user.clientId,
      createdForClientUser: user,
    });
    await sendClientNotificationsForRole(
      'admin',
      req.user.clientId,
      notificationContent
    );
    await sendClientNotificationsForRole(
      'Project Manager',
      req.user.clientId,
      notificationContent
    );

    const updatedProject = await models.projectModel
      .findById(projectId)
      .select('clientUsers')
      .populate({
        path: 'clientUsers',
        model: 'ClientUser',
        select: 'clientUserName clientUserEmail view action',
      });

    const sanitizedClientUsers = updatedProject.clientUsers.map(
      (clientUser) => {
        const { _id, clientUserName, clientUserEmail, view, action } =
          clientUser;
        return { _id, clientUserName, clientUserEmail, view, action };
      }
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'User assigned to project successfully.'
      // { clientUsers: sanitizedClientUsers }
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function makeClientCoordinator(req, res, next) {
  try {
    const { user } = req.body;
    const { projectId } = req.params;
    const creatorName = await getClientName(req.user.clientId);
    const clientUserName = await getClientUserName(user);
    const userId = user;

    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const checkUserInProject = project.clientUsers.some(
      (client) => client.clientUser.toString() === userId
    );
    if (!checkUserInProject) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Please add this user to the project first'
      );
    }

    // Update many documents to set 'isClientCoordinator' to false where 'user' is not the target user
    await models.projectModel.updateMany(
      { _id: projectId },
      {
        $set: {
          'clientUsers.$[elem].isClientCoordinator': false,
        },
      },
      { arrayFilters: [{ 'elem.clientUser': { $ne: userId } }] }
    );

    // Update one document to set 'isClientCoordinator' to true for the target user
    await models.projectModel.updateOne(
      { _id: projectId, 'clientUsers.clientUser': userId },
      {
        $set: {
          'clientUsers.$.isClientCoordinator': true,
        },
      }
    );
    const notificationContent = `${creatorName} made ${clientUserName} as coordinator of the  project '${project.name}'.`;
    await models.notificationModel.create({
      content: notificationContent,
      createdByClient: req.user.clientId,
      createdForClientUser: user,
    });
    await sendClientNotificationsForRole(
      'admin',
      req.user.clientId,
      notificationContent
    );
    await sendClientNotificationsForRole(
      'Project Manager',
      req.user.clientId,
      notificationContent
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'User marked as a client coordinator successfully.'
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function removeClientUser(req, res, next) {
  try {
    const { projectId, clientUserId } = req.params;
    const creatorName = await getClientName(req.user.clientId);
    const clientUserName = await getClientUserName(clientUserId);
    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const clientUser = project.clientUsers.find(
      (clientUser) => clientUser.clientUser.toString() === clientUserId
    );
    if (!clientUser) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        `${clientUserName} is not added to ${project.name}`
      );
    }
    await models.projectModel.findOneAndUpdate(
      { _id: projectId },
      {
        $pull: {
          clientUsers: { clientUser: clientUserId },
        },
      },
      { new: true }
    );
    const notificationContent = `${creatorName} removed ${clientUserName} form the project '${project.name}'.`;
    await models.notificationModel.create({
      content: notificationContent,
      createdByClient: req.user.clientId,
      createdForClientUser: clientUserId,
    });
    // await sendClientNotificationsForRole(
    //   'admin',
    //   req.user.clientId,
    //   notificationContent
    // );
    // await sendClientNotificationsForRole(
    //   'Project Manager',
    //   req.user.clientId,
    //   notificationContent
    // );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `${clientUserName} is removed from ${project.name}`
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

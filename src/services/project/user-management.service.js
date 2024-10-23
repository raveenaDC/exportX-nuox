import httpStatus from 'http-status';
import { responseHelper } from '../../utils/response.helper.js';
import * as models from '../../db/models/index.js';
import {
  getClientName,
  getUserName,
  getClientUserName,
  sendNotificationsForRole,
} from '../../utils/db-helper/notification-creator.helper.js';
const defaultPageLimit = process.env.PAGE_LIMIT;
/**
 * @body {String} user
 * @params {String} projectId
 * @returns {Array} projectAssignees
 */
export async function addProjectAssignee(req, res, next) {
  try {
    const { user } = req.body;
    const { projectId } = req.params;
    const creatorName = await getUserName(req.user.userId);
    const userName = await getUserName(user);
    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const checkUserExists = await models.projectModel.findOne({
      _id: projectId,
      'projectCoordinators.projectCoordinator': user,
    });
    if (checkUserExists) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        `${userName} is already present in this project`
      );
    }

    await models.projectModel.findOneAndUpdate(
      { _id: projectId },
      {
        $push: {
          projectCoordinators: { projectCoordinator: user },
        },
      },
      { new: true }
    );
    await models.userModel.findOneAndUpdate(
      { _id: user },
      {
        $push: {
          projectId: projectId,
        },
      },
      { new: true }
    );

    let notificationContent = `${creatorName} has assigned ${userName} for the project '${project.name}'.`;

    await models.notificationModel.create({
      content: notificationContent,
      createdByUser: req.user.userId,
      createdForUser: user,
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

    const updatedProject = await models.projectModel
      .findById(projectId)
      .select('projectCoordinators')
      .populate({
        path: 'projectCoordinators.projectCoordinator',
        select: 'userImage firstName lastName email',
      });
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `${userName} is assigned to ${project.name} successfully.`,
      { projectAssignees: updatedProject.projectCoordinators }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function makeClientCoordinator(req, res, next) {
  try {
    const { user } = req.body;
    const { projectId } = req.params;
    const creatorName = await getUserName(req.user.userId);
    const clientUser = await getClientUserName(user);

    const userId = user; // Convert user to ObjectId

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
    const isUserAlreadyCoordinator = project.clientUsers.some(
      (clientUser) =>
        clientUser.clientUser.toString() === userId &&
        clientUser.isClientCoordinator
    );

    if (isUserAlreadyCoordinator) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        `${clientUser} is already the client coordinator of ${project.name}.`
      );
    }
    const notificationContent = `${creatorName} made ${clientUser} as the client coordinator of the project '${project.name}'.`;

    if (!checkUserInProject) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Please add this user to the project first'
      );
    } else {
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForClientUser: userId,
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

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `${clientUser} is assigned as the client coordinator of ${project.name}`
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function makeProjectManager(req, res, next) {
  try {
    const { user } = req.body;
    const { projectId } = req.params;
    const creatorName = await getUserName(req.user.userId);
    const coordinator = await getUserName(user);

    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const isUserAlreadyPM = project.projectCoordinators.some(
      (coordinator) =>
        coordinator.projectCoordinator.toString() === user &&
        coordinator.isProjectManager
    );

    if (isUserAlreadyPM) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        `${coordinator} is already the project manager of ${project.name}.`
      );
    }

    const checkUserInProject = await models.projectModel.findOne({
      'projectCoordinators.projectCoordinator': { $in: [user] },
    });

    const notificationContent = `${creatorName} made ${coordinator} as the project manager of the project '${checkUserInProject.name}'.`;

    if (!checkUserInProject) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Please add this user to project first'
      );
    } else {
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForUser: user,
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

    //make every one false
    await models.projectModel.updateMany(
      { _id: projectId },
      {
        $set: {
          'projectCoordinators.$[elem].isProjectManager': false,
        },
      },
      { arrayFilters: [{ 'elem.projectCoordinator': { $ne: user } }] }
    );

    await models.projectModel.updateOne(
      { _id: projectId, 'projectCoordinators.projectCoordinator': user },
      {
        $set: {
          'projectCoordinators.$.isProjectManager': true,
        },
      }
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `${coordinator} is assigned as the project manager of ${project.name}.`
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}
/**
 * @body {String} user
 * @params {String} projectId
 * @returns {Null}
 */
export async function removeProjectAssignee(req, res, next) {
  try {
    const { projectId, userId } = req.params;
    const creatorName = await getUserName(req.user.userId);
    const userName = await getUserName(userId);
    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const coordinator = project.projectCoordinators.find(
      (coordinator) => coordinator.projectCoordinator.toString() === userId
    );
    if (!coordinator) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        `${userName} is not added to ${project.name}`
      );
    }

    await models.projectModel.findOneAndUpdate(
      { _id: projectId },
      {
        $pull: {
          projectCoordinators: { projectCoordinator: userId },
        },
      },
      { new: true }
    );
    await models.userModel.findOneAndUpdate(
      { _id: userId },
      {
        $pull: {
          projectId: projectId,
        },
      },
      { new: true }
    );

    await models.userModel.updateMany(
      { taskId: { $in: project.tasks.map((task) => task._id) } },
      {
        $pull: {
          taskId: { $in: project.tasks.map((task) => task._id) },
        },
      }
    );
    await models.taskModel.updateMany(
      { projectId: projectId },
      {
        $pull: { assignees: userId },
      }
    );
    const notificationContent = `${creatorName} removed ${userName} form the project '${project.name}'.`;

    await models.notificationModel.create({
      content: notificationContent,
      createdByUser: req.user.userId,
      createdForUser: userId,
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
      `${userName} is removed from ${project.name}`
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function getProjectCoordinators(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = await models.projectModel.findById(projectId).populate({
      path: 'projectCoordinators.projectCoordinator',
      select: 'firstName lastName email userImage ',
      populate: {
        path: 'designation',
        model: 'userDesignation',
        select: 'designation',
      },
    });

    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    return responseHelper(res, httpStatus.OK, false, 'project assignees', {
      projectAssignees: project.projectCoordinators,
    });
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}
export async function getClientUsers(req, res, next) {
  try {
    const { projectId } = req.params;
    const { name } = req.query;
    const search = name;

    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    let clientUsers = await models.clientUserModel
      .find({
        clientId: project.clientId,
      })
      .select('clientUserName clientUserEmail clientUserImage');
    //filter by search
    if (search) {
      clientUsers = clientUsers.filter((clientUser) => {
        return clientUser.clientUserName.includes(search);
      });
    }
    clientUsers.sort((a, b) =>
      a.clientUserName.localeCompare(b.clientUserName)
    );
    return responseHelper(res, httpStatus.OK, false, 'client users list', {
      clientUsers: clientUsers,
    });
  } catch (error) {
    return next(new Error(error));
  }
}
/**
 * @body {String} user
 * @params {String} projectId
 * @returns {Array} projectAssignees
 */
export async function addClientUser(req, res, next) {
  try {
    const { user: clientUser } = req.body;
    const { projectId } = req.params;
    const creatorName = await getUserName(req.user.userId);
    const clientUserToAdd = await getClientUserName(clientUser);

    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const existingClientUser =
      await models.clientUserModel.findById(clientUser);
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
      'clientUsers.clientUser': clientUser,
    });
    const notificationContent = `${creatorName} added ${clientUserToAdd} to the project '${project.name}'.`;
    if (checkUserExists) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'User already present in this project'
      );
    } else {
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForClientUser: clientUser,
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

    await models.projectModel.findOneAndUpdate(
      { _id: projectId },
      {
        $push: {
          clientUsers: {
            clientUser: clientUser,
            isClientCoordinator: false,
          },
        },
      },
      { new: true }
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
      `${clientUserToAdd} is assigned to ${project.name} successfully.`
      // { clientUsers: sanitizedClientUsers }
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

/**
 * @body {String} user
 * @params {String} projectId
 * @returns {Null}
 */
export async function removeClientUser(req, res, next) {
  try {
    const { projectId, userId } = req.params;
    const creatorName = await getUserName(req.user.userId);
    const clientUserName = await getClientUserName(userId);
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
      (clientUser) => clientUser.clientUser.toString() === userId
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
          clientUsers: { clientUser: userId },
        },
      },
      { new: true }
    );
    const notificationContent = `${creatorName} removed ${clientUserName} form the project '${project.name}'.`;
    await models.notificationModel.create({
      content: notificationContent,
      createdByUser: req.user.userId,
      createdForClientUser: userId,
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
      `${clientUserName} is removed from ${project.name}.`
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function getClientAssignees(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await models.projectModel.findById(projectId).populate({
      path: 'clientUsers.clientUser',
      model: 'ClientUser',
      select: 'clientUserName clientUserEmail clientUserImage view action',
    });
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    return responseHelper(res, httpStatus.OK, false, 'client assignees', {
      clientAssignees: project.clientUsers,
    });
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

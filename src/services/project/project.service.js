import httpStatus from 'http-status';
import { responseHelper } from '../../utils/response.helper.js';
import * as models from '../../db/models/index.js';
import {
  startOfYear,
  startOfMonth,
  startOfQuarter,
  endOfMonth,
  endOfYear,
  endOfQuarter,
  parse,
} from 'date-fns';
import {
  getClientName,
  getUserName,
  getClientUserName,
  sendNotificationsForRole,
} from '../../utils/db-helper/notification-creator.helper.js';
import { getFullProjectDetails } from '../../utils/db-helper/get-full-project-details.helper.js';
import { populate } from 'dotenv';
import { paginateData } from '../../utils/paginate-data.js';
const defaultPageLimit = process.env.PAGE_LIMIT;
const parseDateString = (dateString) => {
  const [day, month, year] = dateString.split('-');
  return `${year}-${month}-${day}T00:00:00.000Z`;
};

const findStartAndEndDates = (period) => {
  switch (period) {
    case 'quarterly':
      return {
        startDate: startOfQuarter(new Date()),
        endDate: endOfQuarter(new Date()),
      };
    case 'yearly':
      return {
        startDate: startOfYear(new Date()),
        endDate: endOfYear(new Date()),
      };
    default: //monthly by default
      return {
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
      };
  }
};

/**
 * @body {String} clientId
 * @body {String} name
 * @body {String} owner
 * @body {String} description
 * @body {String} startDate
 * @body {String} endDate
 * @body {String} type
 * @body {Object} projectBrief
 * @body {Array} projectCoordinators
 * @returns {Object} project
 */
export async function create(req, res, next) {
  try {
    const {
      clientId,
      name,
      type,
      ownerUserId,
      description,
      startDate,
      endDate,
      coordinators,
      projectBrief,
      projectType,
      designBrief,
    } = req.body;
    const creatorName = await getUserName(req.user.userId);
    let client = await getClientName(clientId);
    let clientUser = await getClientUserName(ownerUserId);
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    const formattedStartDate = parseDateString(startDate);
    const formattedEndDate = parseDateString(endDate);

    const nameExists = await models.projectModel.findOne({
      name: formattedName,
    });
    if (nameExists) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Project with this name already exists. Please choose a different name.'
      );
    }

    const clientCheck = await models.clientModel.findById(clientId);
    if (!clientCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found'
      );
    }
    const uniqueCoordinators = new Set(coordinators);
    if (uniqueCoordinators.size !== coordinators.length) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Coordinators should not be same'
      );
    }
    const ownerUserCheck = await models.clientUserModel.findOne({
      clientId,
      _id: ownerUserId,
    });
    if (!ownerUserCheck) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Owner user must belong to the client users associated with the client'
      );
    }
    const response = [];
    for (const coordinator of coordinators) {
      const userCheck = await models.userModel.findById(coordinator);

      if (!userCheck) {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'some of project coordinator not found'
        );
      }
    }

    const modifiedCoordinators = coordinators.map((coordinator) => {
      return { projectCoordinator: coordinator, isProjectManager: false };
    });

    const project = await models.projectModel.create({
      clientId,
      name: formattedName,
      owner: ownerUserId,
      description,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      type,
      projectCoordinators: modifiedCoordinators,
      'projectBrief.adGoals': projectBrief.adGoal,
      'projectBrief.toneOfVoice': projectBrief.toneOfVoice,
      'projectBrief.callToAction': projectBrief.callToAction,
      'projectBrief.targetAudience': projectBrief.targetAudience,
      'projectBrief.productServiceName': projectBrief.productServiceName,
      'projectBrief.briefDescription': projectBrief.description,
      'projectBrief.pillars': projectBrief.pillars,
      'projectBrief.observationDays': projectBrief.observationDays,
      projectType,
      'designBrief.background': designBrief.background,
      'designBrief.targetAudience': designBrief.toneOfVoice,
      'designBrief.deliverables': designBrief.deliverables,
      'designBrief.additionalInfo': designBrief.additionalInfo,
    });

    if (coordinators) {
      for (const userId of coordinators) {
        const userData = await models.userModel.findById(userId);
        let name = await getUserName(userId);
        if (!userData) {
          errors.push({
            userId,
            status: httpStatus.NOT_FOUND,
            error: true,
            message: 'User not found',
          });
        } else {
          await models.notificationModel.create({
            content: `${creatorName} has assigned ${name} the project '${project.name}'.`,
            createdByUser: req.user.userId,
            createdForUser: userId,
          });
          userData.projectId.push(project.id);
          await userData.save();
          response.push(userId);
        }
      }
    }
    await models.notificationModel.create({
      content: `${creatorName} has added ${client} to the project '${project.name}'.`,
      createdByUser: req.user.userId,
      createdForClient: clientId,
    });
    await models.notificationModel.create({
      content: `${creatorName} appointed ${clientUser} as project owner for the project '${project.name}'.`,
      createdByUser: req.user.userId,
      createdForClientUser: ownerUserId,
    });
    let notificationContent = `${creatorName} created a project named as ${project.name}`;
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
      'New project created successfully',
      { project }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function updateProjectOverView(req, res, next) {
  try {
    const { projectId } = req.params;
    let {
      description,
      startDate,
      endDate,
      projectBrief,
      type,
      designBrief,
    } = req.body;
    startDate = parseDateString(startDate);
    endDate = parseDateString(endDate);

    const dbProject = await models.projectModel.findById(projectId);
    if (!dbProject) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'project not found'
      );
    }

    await models.projectModel.findByIdAndUpdate(projectId, {
      description,
      startDate,
      endDate,
      type,
      projectBrief,
      designBrief,
    });

    const projectDetails = await models.projectModel
      .findById(projectId)
      .populate({
        path: 'clientId',
        select:
          'firstName lastName clientImage brandDescription brandName brandUrl',
      })
      .populate({
        path: 'tasks',
        select: 'type name stage note assignees',
      })
      .populate({
        path: 'projectCoordinators.projectCoordinator',
        model: 'User',
        select: 'userImage firstName lastName designation',
        populate: {
          path: 'designation',
          model: 'userDesignation',
          select: 'designation',
        },
      });

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'project updated successfully',
      {
        project: projectDetails,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getClients(req, res, next) {
  try {
    const { clientId } = req.params;
    const { name = '' } = req.query;
    const query = !name
      ? {}
      : {
          $or: [
            { firstName: { $regex: new RegExp(name, 'i') } },
            { lastName: { $regex: new RegExp(name, 'i') } },
          ],
        };
    const clients = await models.clientModel
      .find(query)
      .select('firstName lastName clientImage');
    return responseHelper(res, httpStatus.OK, false, 'clients', {
      clients,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getClientUsers(req, res, next) {
  try {
    const { clientId } = req.params;
    const dbClient = await models.clientModel.findById(clientId);
    if (!dbClient) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found'
      );
    }
    const { name = '' } = req.query;
    const query = !name
      ? { clientId: clientId }
      : {
          clientUserName: { $regex: new RegExp(name, 'i') },
          clientId: clientId,
        };

    const clients = await models.clientUserModel
      .find(query)
      .select('clientUserName');
    return responseHelper(res, httpStatus.OK, false, 'clients', {
      clients,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getProjectUsers(req, res, next) {
  try {
    const { name = null } = req.query;
    const search = name;
    const adminRole = await models.roleModel.findOne({ roleName: 'admin' });
    let projectUsers = await models.userModel
      .find({
        roleId: { $ne: adminRole._id },
      })
      .select('firstName lastName userImage');

    if (search) {
      projectUsers = projectUsers.filter((user) => {
        const name =
          user.firstName?.toLocaleLowerCase() +
          ' ' +
          user.lastName?.toLocaleLowerCase();
        return name.includes(search?.toLocaleLowerCase());
      });
    }
    projectUsers.sort((a, b) => {
      const fullNameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const fullNameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return fullNameA.localeCompare(fullNameB);
    });
    return responseHelper(res, httpStatus.OK, false, 'project users', {
      projectUsers: projectUsers,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @query {String} period
 * @query {String} search
 * @query {String} page
 * @query {String} pageLimit
 * @query {String} orderBy
 * @query {String} order
 * @returns {Array} projects
 */
export async function findAll(req, res, next) {
  try {
    let {
      period = 'monthly',
      pageLimit = defaultPageLimit,
      page = 1,
      orderBy,
      order = 'asc',
      search = null,
      client = null,
      status = null,
      assignedTo = null,
    } = req.query;
    const { user } = req;

    pageLimit = parseInt(pageLimit);
    page = parseInt(page);
    order = order == 'asc' ? 1 : -1;

    let startDate, endDate;

    switch (period) {
      case 'quarterly':
        startDate = startOfQuarter(new Date());
        endDate = endOfQuarter(new Date());
        break;
      case 'yearly':
        startDate = startOfYear(new Date());
        endDate = endOfYear(new Date());
        break;
      default: //monthly by default
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
    }

    let query = {};

    let orConditions = [];

    if (client) {
      orConditions.push({ clientId: client });
    }
    if (status) {
      orConditions.push({ status: status });
    }
    if (assignedTo) {
      orConditions.push({
        'projectCoordinators.projectCoordinator': assignedTo,
      });
    }

    if (orConditions.length > 0) {
      query.$and = orConditions;
    }

    let sort;
    if (orderBy === 'startDate') {
      sort = { startDate: order === 1 ? 1 : -1 };
    } else if (orderBy === 'endDate') {
      sort = { endDate: order === 1 ? 1 : -1 };
    } else {
      sort = { createdAt: -1 };
    }
    let projects = await models.projectModel
      .find(query)
      .populate({
        path: 'clientId',
        select: 'firstName lastName clientImage',
      })
      .populate({
        path: 'projectCoordinators.projectCoordinator',
        select: 'firstName lastName userImage',
      })
      .select(
        'name clientId projectCoordinators startDate status endDate createdAt'
      )
      .collation({ locale: 'en', strength: 2 })
      .sort(sort);

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      projects = projects.filter((project) => {
        const fullName = `${project.clientId?.firstName} ${project.clientId?.lastName}`;
        return (
          searchRegex.test(project.name) ||
          searchRegex.test(project.clientId?.firstName) ||
          searchRegex.test(project.clientId?.lastName) ||
          searchRegex.test(fullName) ||
          searchRegex.test(project.status)
        );
      });
    }

    //apply sort to clientId
    if (orderBy === 'clientId') {
      projects.sort((a, b) => {
        const nameA = `${a.clientId.firstName} ${a.clientId.lastName}`;
        const nameB = `${b.clientId.firstName} ${b.clientId.lastName}`;

        return order === 1
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA); // Descending order
      });
    }
    if (orderBy === 'name') {
      projects.sort((a, b) => {
        const nameA = a.name;
        const nameB = b.name;

        return order === 1
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA); // Descending order
      });
    }

    if (search) {
      projects.sort(
        (firstProject, secondProject) =>
          firstProject.name.length - secondProject.name.length
      );
    }

    //find project analytics
    const totalProjects = await models.projectModel
      .find({ createdAt: { $gte: startDate, $lte: endDate } })
      .count();
    const completedProjects = await models.projectModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'Completed',
      })
      .count();
    const pendingProjects = await models.projectModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'Pending',
      })
      .count();

    //apply pagination
    const paginationResult = paginateData(projects, page, pageLimit);
    paginationResult.orderBy = '';
    paginationResult.order = order == 1 ? 'asc' : 'desc';

    return responseHelper(res, httpStatus.OK, false, 'projects', {
      projects: paginationResult.data,
      pagination: paginationResult.pagination,
      projectAnalysis: {
        totalCount: totalProjects,
        completedProjects: completedProjects,
        pendingProjects: pendingProjects,
      },
    });
  } catch (error) {
    return next(new Error(error));
  }
}
/**
 * @query {String} period
 * @query {String} search
 * @query {String} page
 * @query {String} pageLimit
 * @query {String} orderBy
 * @query {String} order
 * @returns {Array} projects
 */
/**
 * params {String} projectId
 * @returns {Object} project
 */
export async function findOne(req, res, next) {
  try {
    const { projectId } = req.params;
    const dbProject = await models.projectModel.findById(projectId);
    if (!dbProject) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'project not found'
      );
    }
    const projectDetails = await models.projectModel
      .findById(projectId)
      .populate({
        path: 'clientId',
        select:
          'firstName lastName clientImage email primaryIsdCode primaryContactNo brandUrl brandName brandDescription',
      })
      .populate({
        path: 'tasks',
        select: 'type name stage note assignees status',
        populate: {
          path: 'assignees',
          //  model: 'userDesignation',
          select: 'userImage firstName lastName email',
        },
      })
      .populate({
        path: 'documentType',
        model: 'DocumentType',
      })
      .populate({
        path: 'owner',
        model: 'ClientUser',
        select: 'clientUserName clientUserEmail clientUserImage view action',
      })
      .populate({
        path: 'clientUsers.clientUser',
        select: 'clientUserImage clientUserName clientUserEmail view action',
      })
      .populate({
        path: 'discuss.userId',
        select: 'userImage firstName lastName',
      })
      .populate({
        path: 'projectCoordinators.projectCoordinator',
        model: 'User',
        select: 'userImage firstName lastName designation',
        populate: {
          path: 'designation',
          model: 'userDesignation',
          select: 'designation',
        },
      });

    return responseHelper(res, httpStatus.OK, false, 'projects', {
      project: projectDetails,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @query {String} search
 * @query {String} client
 * @query {String} assignedTo
 * @query {String} status
 * @returns {Array} projects
 */
export async function filter(req, res, next) {
  try {
    const { search, client, assignedTo, status } = req.params;

    const query = {
      ...(status && { status: status }),
      ...(client && { clientId: client }),
      ...(assignedTo && { projectAssignees: assignedTo }),
      // $or: [
      // ].filter(Boolean),
    };
    // if (query.$or.length === 0) {
    //   query.$or.push({});
    // }

    const projects = await models.projectModel.find(query);
    return responseHelper(res, httpStatus.OK, false, 'projects', {
      projects: projects,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @body {String} status
 * @params {String} projectId
 * @returns {Array} project
 */
export async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const { projectId } = req.params;
    let creatorName = await getUserName(req.user.userId);

    const projectCheck = await models.projectModel.findById(projectId);
    if (!projectCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'project not found'
      );
    }
    switch (status) {
      case 'Completed':
        if (projectCheck.status === 'Completed') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'this project is already completed'
          );
        }
        break;
      case 'Pending':
        if (projectCheck.status === 'Completed') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'Cannot change the status to pending for a completed project'
          );
        } else if (projectCheck.status === 'Pending') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'this project is already pending'
          );
        }
        break;
      case 'Ongoing':
        if (projectCheck.status === 'Completed') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'Cannot change the status to ongoing for a completed project'
          );
        } else if (projectCheck.status === 'Ongoing') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'this project is already ongoing'
          );
        }
        break;
    }

    const updatedProject = await models.projectModel.findByIdAndUpdate(
      projectId,
      {
        status: status,
      },
      { new: true }
    );
    let notificationContent = `${creatorName} updated the status of the project '${updatedProject.name}' to '${updatedProject.status}'`;

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
    updatedProject.projectCoordinators.forEach(async (coordinator) => {
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForUser: coordinator.projectCoordinator,
      });
    });

    updatedProject.clientUsers.forEach(async (user) => {
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForClientUser: user.clientUser,
      });
    });

    await models.notificationModel.create({
      content: notificationContent,
      createdByUser: req.user.userId,
      createdForClient: updatedProject.clientId,
    });
    await models.notificationModel.create({
      content: notificationContent,
      createdByUser: req.user.userId,
      createdForClientUser: updatedProject.owner,
    });

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `project status updated to ${status} successfully.`,
      { messages: updatedProject }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

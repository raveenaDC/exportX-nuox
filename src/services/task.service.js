import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
import * as models from '../db/models/index.js';
import {
  sendNotificationsForRole,
  getUserName,
} from '../utils/db-helper/notification-creator.helper.js';
/**
 * @body {String} projectId
 * @body {String} type
 * @body {String} name
 * @body {String} stage
 * @body {String} note
 * @body {Array} assignees
 * @returns {Object} task
 */
export async function create(req, res, next) {
  try {
    const { projectId, type, name, stage, note, assignees } = req.body;
    const creatorId = req.user.userId;
    const creatorName = await getUserName(creatorId);
    const project = await models.projectModel.findById(projectId).populate({
      path: 'projectCoordinators.projectCoordinator',
      select: 'firstName lastName userImage',
    });
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    const hasDuplicates = assignees.length !== new Set(assignees).size;
    if (hasDuplicates) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Task asignees must be different'
      );
    }
    //check assignees of project
    const invalidAssignees = assignees.filter(
      (assignee) =>
        !project.projectCoordinators.some(
          (coordinator) =>
            coordinator.projectCoordinator._id.toString() === assignee
        )
    );
    if (invalidAssignees.length > 0) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'some of the assignees for this task are not part of this project'
      );
    }
    const uniqueAssignees = Array.from(new Set(assignees));
    // const assigneeNames = await Promise.all(uniqueAssignees.map(async (assignee) => await getUserName(assignee)));
    const task = await models.taskModel.create({
      creator: creatorId,
      projectId,
      type,
      name,
      stage,
      note,
      assignees: uniqueAssignees,
    });
    await models.userModel.updateMany(
      { _id: { $in: uniqueAssignees } },
      { $push: { taskId: task._id } }
    );

    let notificationContent;

    for (const uniqueAssignee of uniqueAssignees) {
      let assigneeName = await getUserName(uniqueAssignee);
      notificationContent = `${creatorName} assigned ${assigneeName} to the task '${task.name}' in the project '${project.name}'.`; // Update notificationContent inside the loop
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForUser: uniqueAssignee,
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

    const populatedTask = await models.taskModel
      .findById(task._id)
      .populate('creator', 'firstName lastName email userImage');
    const updatedProject = await models.projectModel.findOneAndUpdate(
      { _id: projectId },
      { $push: { tasks: task._id } },
      { new: true }
    );
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'new task created successfully',
      { task: populatedTask }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @params {String} projectId
 */
export async function findAll(req, res, next) {
  try {
    const { projectId } = req.params;
    const { search } = req.query;

    const query = !search
      ? { projectId }
      : { projectId, name: { $regex: new RegExp(search, 'i') } };

    const tasks = await models.taskModel.find(query).populate({
      path: 'assignees',
      select: 'firstName lastName email userImage',
    });

    const completedTasks = tasks.filter((task) =>
      ['Completed', 'Submit For Approval', 'Approved'].includes(task.status)
    );
    const pendingTasks = tasks.filter((task) => task.status === 'Pending');
    const submittedForApprovalTasks = tasks.filter(
      (task) => task.status === 'Submit For Approval'
    );
    const approvedTasks = tasks.filter((task) => task.status === 'Approved');
    const inProgressTasks = tasks.filter((task) =>
      ['In Progress', 'Rework required'].includes(task.status)
    );
    const reworkRequiredTasks = tasks.filter(
      (task) => task.status === 'Rework required'
    );

    const responseData = {
      tasks: {
        all: tasks,
        completed: completedTasks,
        pending: pendingTasks,
        submittedForApproval: submittedForApprovalTasks,
        approved: approvedTasks,
        inProgress: inProgressTasks,
        reworkRequired: reworkRequiredTasks,
      },
    };
    return responseHelper(res, httpStatus.OK, false, 'tasks', responseData);
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getProjects(req, res, next) {
  try {
    const { search } = req.query;

    const query = !search ? {} : { name: { $regex: new RegExp(search, 'i') } };
    const projects = await models.projectModel
      .find(query)
      .select('name description');

    return responseHelper(res, httpStatus.OK, false, 'projects list', {
      projects: projects,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getAssignees(req, res, next) {
  try {
    const { projectId } = req.params;
    const { search } = req.query;

    const project = await models.projectModel.findById(projectId).populate({
      path: 'projectCoordinators.projectCoordinator',
      select: 'firstName lastName email userImage',
    });
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    let coordinators = project.projectCoordinators.map(
      (coordinator) => coordinator.projectCoordinator
    );

    if (search) {
      coordinators = coordinators.filter((user) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(search.toLowerCase());
      });
    }

    return responseHelper(res, httpStatus.OK, false, 'all tasks', {
      assignees: coordinators,
    });
  } catch (error) {
    return next(new Error(error));
  }
}
/**
 * @params {String} projectId
 * @params {String} taskId
 * @returns {Object} task
 */
export async function findOne(req, res, next) {
  try {
    const { projectId, taskId } = req.params;

    const task = await models.taskModel
      .findOne({ _id: taskId, projectId: projectId })
      .populate({
        path: 'assignees',
        select: 'firstName lastName email userImage',
      })
      .populate({
        path: 'creator',
        select: 'firstName lastName email userImage',
      });
    return responseHelper(res, httpStatus.OK, false, 'task', { task: task });
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @body {String} type
 * @body {String} name
 * @body {Array} assignees
 * @body {String} note
 * @params {String} projectId
 * @params {String} taskId
 * @returns {Object} task
 */
export async function update(req, res, next) {
  try {
    const { projectId, taskId } = req.params;
    const { type, name, assignees, note } = req.body;

    const existingTask = await models.taskModel.findById(taskId);

    if (!existingTask) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'Task not found');
    }

    const project = await models.projectModel.findById(projectId);

    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    // const existingAssignees = await models.taskModel.find({
    //   _id: taskId,
    //   assignees: { $in: assignees },
    // });

    // if (existingAssignees.length > 0) {
    //   const assigneeDetails = await models.userModel.find(
    //     { _id: { $in: assignees } },
    //     { firstName: 1, lastName: 1 }
    //   );

    //   const assigneeNames = assigneeDetails.map(
    //     (user) => `${user.firstName} ${user.lastName}`
    //   );

    //   return responseHelper(
    //     res,
    //     httpStatus.BAD_REQUEST,
    //     true,
    //     `Some of the assignees (${assigneeNames.join(
    //       ', '
    //     )}) already exist in the task.`
    //   );
    // }

    // const updatedAssigneesSet = new Set(
    //   existingTask.assignees.map((assignee) => assignee.toString())
    // );
    const updatedAssigneesSet = new Set(assignees.map(String));

    const hasDuplicates = assignees.length !== new Set(assignees).size;
    if (hasDuplicates) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Task assignees must be different'
      );
    }

    const updatedTask = await models.taskModel.findOneAndUpdate(
      {
        _id: taskId,
        projectId: projectId,
      },
      { type, name, assignees: Array.from(updatedAssigneesSet), note },
      { new: true }
    );
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'task updated successfully',
      { task: updatedTask }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @params {String} projectId
 * @params {String} taskId
 * @returns {Null}
 */
export async function remove(req, res, next) {
  try {
    const { projectId, taskId } = req.params;

    const task = await models.taskModel.findOneAndDelete({
      _id: taskId,
      projectId: projectId,
    });
    if (!task) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'task not found');
    }
    for (const assigneeId of task.assignees) {
      await models.userModel.findOneAndUpdate(
        { _id: assigneeId },
        { $pull: { taskId: taskId } }
      );
    }
    await models.projectModel.findOneAndUpdate(
      { _id: projectId },
      { $pull: { tasks: taskId } }
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'task deleted successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @body {String} stage
 * @params {String} projectId
 * @params {String} taskId
 * @returns {Object} task
 */
export async function updateStatus(req, res, next) {
  try {
    const { projectId, taskId } = req.params;
    const { status } = req.body;
    const creatorName = await getUserName(req.user.userId);
    const project = await models.projectModel.findById(projectId);

    const task = await models.taskModel.findById(taskId);
    switch (status) {
      case 'Completed':
        if (task.status === 'Completed') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'this task is already completed'
          );
        } else if (task.status === 'Submit For Approval') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'this task is already submitted for approval'
          );
        } else if (task.status === 'Approved') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'this task is already approved'
          );
        }
        break;
      case 'Pending':
        if (task.status === 'Completed') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'cannot change the status to pending for a completed task'
          );
        } else if (task.status === 'Pending') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'This task is already pending'
          );
        } else if (task.status === 'Approved') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'cannot change the status to pending for an approved task'
          );
        } else if (task.status === 'Submit For Approval') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'cannot change the status to pending for a task submitted for approval'
          );
        }
        break;
      case 'In Progress':
        if (task.status === 'Completed') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'cannot change the status to inprogress for a completed Task'
          );
        } else if (task.status === 'In Progress') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'this task is already In Progress'
          );
        } else if (task.status === 'Approved') {
          return responseHelper(
            res,
            httpStatus.BAD_REQUEST,
            true,
            'cannot change the status to inprogress for an approved Task'
          );
        }
        break;
    }

    const updatedTask = await models.taskModel
      .findOneAndUpdate(
        {
          _id: taskId,
          projectId: projectId,
        },
        { status },
        { new: true }
      )
      .populate({ path: 'projectId', select: 'name' });

    let notificationContent = `${creatorName} updated the task '${updatedTask.name}' status to '${status}' in project '${updatedTask.projectId.name}'.`;

    const projectManagers = project.projectCoordinators
      .filter((coordinator) => coordinator.isProjectManager === true)
      .map((coordinator) => coordinator.projectCoordinator);

    for (const managerId of projectManagers) {
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForUser: managerId,
      });
    }
    for (const assignee of updatedTask.assignees) {
      await models.notificationModel.create({
        content: notificationContent,
        createdByUser: req.user.userId,
        createdForUser: assignee,
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
      `task status updated to ${status} successfully`,
      { task: updatedTask }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function sendForApproval(req, res, next) {
  try {
    const { projectId, taskId } = req.params;
    const creatorName = await getUserName(req.user.userId);
    const projectCheck = await models.projectModel.findById(projectId);
    if (!projectCheck) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'project not found'
      );
    }

    const taskCheck = await models.taskModel.findById(taskId);
    if (!taskCheck) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'task not found');
    }
    if (taskCheck.status === 'Approved') {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'this task is already approved'
      );
    }
    if (taskCheck.status === 'Submit For Approval') {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'this task is already submitted for approval'
      );
    }

    if (
      ['Pending', 'In Progress', 'Rework required'].includes(taskCheck.status)
    ) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Task must be completed before sending for approval'
      );
    }

    const updatedTask = await models.taskModel.findOneAndUpdate(
      {
        _id: taskId,
        projectId: projectId,
      },
      {
        status: 'Submit For Approval',
      },
      { new: true }
    );
    const projectManagerIds = projectCheck.projectCoordinators
      .filter((coordinator) => coordinator.isProjectManager === true)
      .map((coordinator) => coordinator.projectCoordinator);

    let notificationContent = `${creatorName} has submitted the task '${updatedTask.name}' of the project '${projectCheck.name}' for approval.`;

    await Promise.all(
      projectManagerIds.map(async (managerId) => {
        await models.notificationModel.create({
          content: notificationContent,
          createdByUser: req.user.userId,
          createdForUser: managerId,
        });
      })
    );
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
      'task has been sent for approval'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function bulkAction(req, res, next) {
  try {
    const { projectId } = req.params;
    const { tasks, action } = req.body;
    const creatorName = await getUserName(req.user.userId);
    const projectExists = await models.projectModel.findById(projectId);

    if (!projectExists) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const changesForItems = [];
    let changes = {};
    let allConditionsSatisfied = true;
    for (const taskId of tasks) {
      const task = await models.taskModel
        .findById(taskId)
        .populate('assignees');
      if (!task) continue;

      switch (action) {
        case 'Submit For Approval':
          if (task.status === 'Completed') {
            changes = { task: taskId, status: 'Submit For Approval' };
          } else {
            allConditionsSatisfied = false;
          }
          break;
        case 'Rework required':
          if (
            ['In Progress', 'Pending', 'Submit For Approval'].includes(
              task.status
            )
          ) {
            changes = { task: taskId, status: 'Rework required' };
          } else {
            allConditionsSatisfied = false;
          }
          break;
        case 'Approved':
          if (task.status === 'Submit For Approval') {
            changes = { task: taskId, status: 'Approved' };
          } else {
            allConditionsSatisfied = false;
          }
          break;
      }

      if (allConditionsSatisfied) {
        changesForItems.push({
          task: taskId,
          status: changes.status,
        });
      } else {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          'Some conditions were not satisfied. Kindly review the status of the task(s).'
        );
      }
    }

    for (const { task, status } of changesForItems) {
      console.log(projectId);
      await models.taskModel.findOneAndUpdate(
        { _id: task, projectId },
        { $set: { status } }
      );
    }

    for (const taskId of tasks) {
      const task = await models.taskModel
        .findById(taskId)
        .populate('assignees');

      if (!task) continue;

      const notificationContent = `${creatorName} updated the status to '${action}' of the '${task.name}' task in the project '${projectExists.name}'.`;

      for (const assignee of task.assignees) {
        await models.notificationModel.create({
          content: notificationContent,
          createdByUser: req.user.userId,
          createdForUser: assignee,
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
    }
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `tasks status updated to '${action}' `
    );
  } catch (error) {
    return next(new Error(error));
  }
}

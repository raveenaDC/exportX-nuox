import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
import * as models from '../db/models/index.js';
import {
  getUserName,
  sendNotificationsForRole,
} from '../utils/db-helper/notification-creator.helper.js';
import { getFullProjectDetails } from '../utils/db-helper/get-full-project-details.helper.js';

export async function getAllClients(req, res, next) {
  try {
    const { search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: new RegExp(search, 'i') } },
        { lastName: { $regex: new RegExp(search, 'i') } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: new RegExp(search, 'i'),
            },
          },
        },
      ];
    }

    const clients = await models.clientModel
      .find(query)
      .sort({ createdAt: -1 })
      .select('firstName lastName clientImage');

    if (!clients) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'No clients found'
      );
    }

    return responseHelper(res, httpStatus.OK, false, 'List of clients', {
      clients,
    });
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function getProjectsByClientId(req, res, next) {
  try {
    const { clientId } = req.params;
    const { search } = req.query;

    let projects;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      projects = await models.projectModel
        .find({
          clientId: clientId,
          name: { $regex: searchRegex },
        })
        .select('name clientId');
    } else {
      projects = await models.projectModel
        .find({ clientId: clientId })
        .select('name clientId');
    }

    if (!projects) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'No projects found for the specified client'
      );
    }

    return responseHelper(res, httpStatus.OK, false, 'List of projects', {
      projects,
    });
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function getAllSocialMediaContents(req, res, next) {
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
    return next(new Error(error));
  }
}

export async function updateItemStatus(req, res, next) {
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
    const creatorName = await getUserName(req.user.userId);

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);

    const selectedItem = socialMediaPlanner?.items.find(
      (item) => item._id == itemId
    );

    let statusMessage;

    if (status === 'SubmitToClient') {
      statusMessage = 'submit to client';
    } else if (status === 'ApprovedByClient') {
      statusMessage = 'approved by client';
    } else {
      statusMessage = status;
    }

    if (
      status == 'SubmitToClient' &&
      !['Approved'].includes(selectedItem.approval.status)
    ) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'Only approved post can be submitted to client'
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
    let notificationContent = `${creatorName} updated the status of post '${socialMediaPlanner.title}' in project '${project.name}' to '${statusMessage}'.`;

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
      `post status updated to ${statusMessage} successfully`
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
      httpStatus.OK,
      false,
      'Post scheduled successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}
export async function setBulkAction(req, res, next) {
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
            `plan not found`
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

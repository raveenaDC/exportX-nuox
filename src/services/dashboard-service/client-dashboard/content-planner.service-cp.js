import httpStatus from 'http-status';
import { unlinkSync } from 'fs';
import * as path from 'path';
import { responseHelper } from '../../../utils/response.helper.js';
import * as models from '../../../db/models/index.js';
import {
  getClientName,
  getUserName,
  getClientUserName,
  sendClientNotificationsForRole,
} from '../../../utils/db-helper/notification-creator.helper.js';
// export async function getSocialMediaPlanner(req, res, next) {
//   const findPlanWithPostImagePopulate = async (id) => {
//     const planner = await models.socialMediaPlannerModel.findById(id).populate({
//       path: 'items.posts.images',
//       model: 'Image',
//     });

//     return planner;
//   };

//   const fetchSelectedPlansWithPosts = async (planners) => {
//     const selectedPlans = await Promise.all(
//       planners.map(async (planner) => {
//         const plan = await findPlanWithPostImagePopulate(planner.plan);
//         return {
//           ...plan.items,
//           planId: plan._id,
//           title: plan.title,
//         };
//       })
//     );

//     return selectedPlans;
//   };

//   try {
//     const { projectId } = req.params;
//     const project = await models.projectModel.findById(projectId);
//     if (!project) {
//       return responseHelper(
//         res,
//         httpStatus.NOT_FOUND,
//         true,
//         'Project not found'
//       );
//     }

//     const socialMediaPlanner = project.contentPlanner?.socialMediaPlanner;
//     const englishPlanners = socialMediaPlanner?.filter(
//       (planner) => planner.language === 'english'
//     );
//     const arabicPlanners = socialMediaPlanner?.filter(
//       (planner) => planner.language === 'arabic'
//     );

//     const selectedEnglishPlans =
//       await fetchSelectedPlansWithPosts(englishPlanners);
//     const selectedArabicPlans =
//       await fetchSelectedPlansWithPosts(arabicPlanners);

//     return responseHelper(
//       res,
//       httpStatus.CREATED,
//       false,
//       'social media planner',
//       {
//         english: selectedEnglishPlans,
//         arabic: selectedArabicPlans,
//       }
//     );
//   } catch (error) {
//     return next(new Error(error));
//   }
// }

export async function getFiltersItems(req, res, next) {
  try {
    const { projectId } = req.params;
    const project = await models.projectModel.findById(projectId);

    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const socialMediaPlanWithItems =
      project?.contentPlanner?.socialMediaPlanner || [];
    const modifiedPlanItems = [];
    for (const planItem of socialMediaPlanWithItems) {
      const planId = planItem?.plan?._id;

      if (planId) {
        let item = await models.socialMediaPlannerModel.findById(planId);
        if (item) {
          await models.socialMediaPlannerModel.populate(item, {
            path: 'items.posts.images',
            model: 'Image',
          });
          item.items.forEach((item) => {
            const postWithImageIndex = item.posts.findIndex(
              (post) => post.images.length > 0
            );
            const postIndex =
              postWithImageIndex === -1 ? 0 : postWithImageIndex;

            modifiedPlanItems.push({
              projectId: projectId,
              language: planItem.language,
              status: item.approval.status,
              comments: item.comments || '',
              scheduledDate: item.scheduledDate || '',
              post: item.posts[postIndex]?.post || '',
              image: item.posts[postIndex]?.images[0]?.path || '',
              itemId: item._id,
              planId,
            });
          });
        }
      }
    }

    const filterByStatus = (status) =>
      modifiedPlanItems.filter((item) => item.status === status);
    const filterByDate = (status) =>
      modifiedPlanItems.filter((item) => item.scheduledDate != '');
    const all = modifiedPlanItems.filter((item) =>
      [
        'ApprovedByClient',
        'ReworkByClient',
        'RejectedByClient',
        'Scheduled',
        'SubmitToClient',
      ].includes(item.status)
    );
    const rejected = filterByStatus('RejectedByClient');
    const recentlySubmited = filterByStatus('SubmitToClient');
    const approved = filterByStatus('ApprovedByClient');
    const scheduled = filterByDate('Scheduled');

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Social media planner items',
      {
        all,
        rejected,
        recentlySubmited,
        approved,
        scheduled,
      }
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function getSocialMediaPlannerById(req, res, next) {
  try {
    const { planId } = req.params;
    const plan = await models.socialMediaPlannerModel
      .findById(planId)
      .populate({
        path: 'items.posts.images',
        model: 'Image',
      })
      .populate({
        path: 'items.approval.comments.commentedBy',
        model: 'User',
        select: 'firstName lastName userImage',
      });

    if (!plan) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Content planner not found'
      );
    }

    return responseHelper(res, httpStatus.OK, false, 'social media planner', {
      post: plan,
    });
  } catch (error) {
    return next(new Error(error));
  }
}
export async function getSocialMediaPlanContentById(req, res, next) {
  try {
    const { planId, itemId } = req.params;
    const plan = await models.socialMediaPlannerModel
      .findOne({ _id: planId, 'items._id': itemId }, { 'items.$': 1 })
      .select('title')
      .populate({
        path: 'items.posts.images',
        model: 'Image',
      })
      .populate({
        path: 'items.approval.comments.commentedBy',
        model: 'User',
        select: 'firstName lastName userImage',
      });
    if (!plan) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Content planner not found'
      );
    }
    const matchedItem = plan.items[0];

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Social media planner',
      {
        post: { ...plan.toObject(), items: matchedItem },
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

// export async function setScheduleDate(req, res, next) {
//   try {
//     const { planId } = req.params;
//     const plan = await models.socialMediaPlannerModel.findById(planId);

//     if (!plan) {
//       return responseHelper(res, httpStatus.NOT_FOUND, true, 'Plan not found');
//     }

//     const { scheduleDate } = req.body;

//     if (plan.approval.status !== 'ApprovedByClient') {
//       return responseHelper(
//         res,
//         httpStatus.NOT_FOUND,
//         true,
//         'The project is not approved'
//       );
//     }
//     const parseDateString = (dateString) => {
//       const [day, month, year] = dateString.split('-');
//       return `${year}-${month}-${day}T00:00:00.000Z`;
//     };
//     const schedule = parseDateString(scheduleDate);
//     const updatedPlan = await models.socialMediaPlannerModel.findOneAndUpdate(
//       { _id: planId },
//       { scheduledDate: schedule, 'approval.status': 'Scheduled' },
//       { new: true }
//     );

//     return responseHelper(
//       res,
//       httpStatus.CREATED,
//       false,
//       'Scheduled successfully',
//       { plan: updatedPlan }
//     );
//   } catch (error) {
//     console.error(error);
//     return next(new Error(error));
//   }
// }

export async function setBulkAction(req, res, next) {
  try {
    const { selectedContents } = req.body;
    const { action } = req.query;
    const { projectId } = req.params;
    // if (req.user.role != 'client') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to do this action.'
    //   );
    // }
    let modifiedAction;
    switch (action) {
      case 'RejectedByClient':
        modifiedAction = 'Rejected By Client';
        break;
      case 'ReworkByClient':
        modifiedAction = 'Rework By Client';
        break;
      case 'SubmitToClient':
        modifiedAction = 'Submit To Client';
        break;
      case 'ApprovedByClient':
        modifiedAction = 'Approved By Client';
        break;
      default:
        modifiedAction = action;
        break;
    }
    let project = await models.projectModel.findById(projectId);
    const creatorName = req.user.clientId
      ? await getClientName(req.user.clientId)
      : await getClientUserName(req.user.clientUserId);

    let titles = [],
      allConditionsSatisfied = true,
      planner;
    const changesForItems = [];

    await Promise.all(
      selectedContents.map(async ({ planId, contentId }) => {
        planner = planner =
          await models.socialMediaPlannerModel.findById(planId);

        if (!planner) {
          return responseHelper(
            res,
            httpStatus.NOT_FOUND,
            true,
            `Plan not found for id: ${planId}`
          );
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
          case 'RejectedByClient':
            if (
              ['ReworkByClient', 'RejectedByClient', 'SubmitToClient'].includes(
                planner.items[selectedItemIndex].approval.status
              ) &&
              planner.items[selectedItemIndex].scheduledDate == null
            ) {
              changes = {
                approvalStatus: 'RejectedByClient',
              };
            } else {
              allConditionsSatisfied = false;
            }
            break;

          case 'ReworkByClient':
            if (
              ['RejectedByClient', 'ReworkByClient', 'SubmitToClient'].includes(
                planner.items[selectedItemIndex].approval.status
              ) &&
              planner.items[selectedItemIndex].scheduledDate == null
            ) {
              changes = {
                approvalStatus: 'ReworkByClient',
              };
            } else {
              allConditionsSatisfied = false;
            }
            break;

          case 'ApprovedByClient':
            if (
              [
                'ApprovedByClient',
                'ReworkByClient',
                'SubmitToClient',
                'Approved',
              ].includes(planner.items[selectedItemIndex].approval.status)
            ) {
              changes = {
                approvalStatus: 'ApprovedByClient',
              };
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
          approvalStatus: changes.approvalStatus,
        });
      })
    );
    if (allConditionsSatisfied) {
      for (const { planId, contentId, approvalStatus } of changesForItems) {
        await models.socialMediaPlannerModel.findOneAndUpdate(
          { _id: planId, 'items._id': contentId },
          {
            $set: {
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
    for (const title of uniqueTitles) {
      let notificationContent = `${creatorName} updated some contents of post '${title}' for project '${project.name}' to ${modifiedAction}.`;

      project.projectCoordinators.forEach(async (coordinator) => {
        await models.notificationModel.create({
          content: notificationContent,
          createdByClient: req.user.clientId,
          createdByClientUser: req.user.clientUserId,
          createdForUser: coordinator.projectCoordinator,
        });
      });

      project.clientUsers.forEach(async (user) => {
        await models.notificationModel.create({
          content: notificationContent,
          createdByClient: req.user.clientId,
          createdByClientUser: req.user.clientUserId,
          createdForClientUser: user.clientUser,
        });
      });

      await models.notificationModel.create({
        content: notificationContent,
        createdByClient: req.user.clientId,
        createdByClientUser: req.user.clientUserId,
        createdForClientUser: project.owner,
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
    }
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Approval status changed for selected post(s)'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function updatePostStatus(req, res, next) {
  try {
    const { projectId, planId, itemId } = req.params;
    const { status } = req.body;
    // if (req.user.role != 'client') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to update post status.'
    //   );
    // }
    let modifiedStatus;
    switch (status) {
      case 'ApprovedByClient':
        modifiedStatus = 'Approved By Client';
        break;
      case 'SubmitToClient':
        modifiedStatus = 'Submit To Client';
        break;
      case 'ReworkByClient':
        modifiedStatus = 'Rework By Client';
        break;
      case 'RejectedByClient':
        modifiedStatus = 'Rejected By Client';
        break;
      default:
        modifiedStatus = status;
        break;
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
    const creatorName = req.user.clientId
      ? await getClientName(req.user.clientId)
      : await getClientUserName(req.user.clientUserId);

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);
    const selectedItem = socialMediaPlanner.items.find(
      (item) => item._id == itemId
    );
    if (selectedItem) {
      if (
        status === 'ApprovedByClient' &&
        !['SubmitToClient', 'ReworkByClient', 'Approved'].includes(
          selectedItem.approval.status
        )
      ) {
        if (selectedItem.approval.status === 'ApprovedByClient') {
          return responseHelper(
            res,
            httpStatus.CONFLICT,
            true,
            'You have already approved this post.'
          );
        } else {
          return responseHelper(
            res,
            httpStatus.CONFLICT,
            true,
            `Can not approve the post with status ${selectedItem.approval.status} .`
          );
        }
      }

      if (
        status === 'ReworkByClient' &&
        !['RejectedByClient', 'SubmitToClient', 'ReworkByClient'].includes(
          selectedItem.approval.status
        )
      ) {
        if (selectedItem.scheduledDate != null) {
          return responseHelper(
            res,
            httpStatus.CONFLICT,
            true,
            `This post is already scheduled.`
          );
        } else {
          return responseHelper(
            res,
            httpStatus.CONFLICT,
            true,
            `Can not Rework the post with status ${selectedItem.approval.status} .`
          );
        }
      }

      if (
        status === 'RejectedByClient' &&
        !['SubmitToClient', 'ReworkByClient', 'RejectedByClient'].includes(
          selectedItem.approval.status
        )
      ) {
        if (selectedItem.scheduledDate != null) {
          return responseHelper(
            res,
            httpStatus.CONFLICT,
            true,
            `This post is already scheduled.`
          );
        } else {
          return responseHelper(
            res,
            httpStatus.CONFLICT,
            true,
            `Can not Reject the post with status ${selectedItem.approval.status} .`
          );
        }
      }
      selectedItem.approval.status = status;
      await socialMediaPlanner?.save();
      let notificationContent = `${creatorName} updated the status of post '${socialMediaPlanner.title}' in project '${project.name}' to '${modifiedStatus}'.`;

      project.projectCoordinators.forEach(async (coordinator) => {
        await models.notificationModel.create({
          content: notificationContent,
          createdByClient: req.user.clientId,
          createdForUser: coordinator.projectCoordinator,
        });
      });

      project.clientUsers.forEach(async (user) => {
        await models.notificationModel.create({
          content: notificationContent,
          createdByClient: req.user.clientId,
          createdForClientUser: user.clientUser,
        });
      });

      await models.notificationModel.create({
        content: notificationContent,
        createdByClient: req.user.clientId,
        createdForClientUser: project.owner,
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
        httpStatus.CREATED,
        false,
        `Post status updated to ${modifiedStatus} successfully`
      );
    } else {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Item not found in the social media planner.'
      );
    }
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function addComment(req, res, next) {
  try {
    const { projectId, planId, itemId } = req.params;
    const project = await models.projectModel.findById(projectId);

    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const updatedPlan = await models.socialMediaPlannerModel
      .findOneAndUpdate(
        { _id: planId, 'items._id': itemId },
        {
          $push: {
            'items.$.approval.comments': {
              comment: req.body.comment,
              date: new Date(),
              commentedBy: req.user.userId,
            },
          },
        },
        { new: true }
      )
      .populate({
        path: 'items.approval.comments.commentedBy',
        model: 'User',
        select: 'firstName lastName userImage',
      });
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Post comment added successfully.',
      { comments: updatedPlan?.items[0]?.approval?.comments }
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function deleteComment(req, res, next) {
  try {
    const { projectId, planId, itemId, commentId } = req.params;
    const project = await models.projectModel.findById(projectId);

    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    await models.socialMediaPlannerModel.findOneAndUpdate(
      { _id: planId, 'items._id': itemId },
      {
        $pull: {
          'items.$.approval.comments': {
            _id: commentId,
          },
        },
      },
      { new: true }
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'post comment deleted successfully.'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

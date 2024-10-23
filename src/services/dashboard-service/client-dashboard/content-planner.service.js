import httpStatus from 'http-status';
import { unlinkSync } from 'fs';
import * as path from 'path';
import { responseHelper } from '../../../utils/response.helper.js';
import * as models from '../../../db/models/index.js';

export async function getSocialMediaPlanner(req, res, next) {
  const findPlanWithPostImagePopulate = async (id) => {
    const planner = await models.socialMediaPlannerModel.findById(id).populate({
      path: 'items.posts.images',
      model: 'Image',
    });

    return planner;
  };

  const fetchSelectedPlansWithPosts = async (planners) => {
    const selectedPlans = await Promise.all(
      planners.map(async (planner) => {
        const plan = await findPlanWithPostImagePopulate(planner.plan);
        return {
          ...plan.items,
          planId: plan._id,
          title: plan.title,
        };
      })
    );

    return selectedPlans;
  };

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

    const socialMediaPlanner = project.contentPlanner?.socialMediaPlanner;
    const englishPlanners = socialMediaPlanner?.filter(
      (planner) => planner.language === 'english'
    );
    const arabicPlanners = socialMediaPlanner?.filter(
      (planner) => planner.language === 'arabic'
    );

    const selectedEnglishPlans =
      await fetchSelectedPlansWithPosts(englishPlanners);
    const selectedArabicPlans =
      await fetchSelectedPlansWithPosts(arabicPlanners);

    return responseHelper(res, httpStatus.OK, false, 'social media planner', {
      english: selectedEnglishPlans,
      arabic: selectedArabicPlans,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function getSocialMediaPlannerById(req, res, next) {
  try {
    const { postId } = req.params;
    const plan = await models.socialMediaPlannerModel
      .findById(postId)
      .populate({
        path: 'items.posts.images', // Use the correct path based on your schema structure
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

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'social media planner',
      {
        post: plan,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}
export async function getSocialMediaPlanContentById(req, res, next) {
  try {
    const { postId, itemId } = req.params;
    const plan = await models.socialMediaPlannerModel
      .findOne({ _id: postId, 'items._id': itemId }, { 'items.$': 1 })
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

    return responseHelper(res, httpStatus.OK, false, 'Social media planner', {
      post: { ...plan.toObject(), items: matchedItem },
    });
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

//     if (plan.approval.status !== 'Client Approved') {
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
    for (const { planId, contentId } of selectedContents) {
      const planner = await models.socialMediaPlannerModel.findById(planId);

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
      switch (action) {
        case 'reject':
          if (
            ['Client Rework', 'Client Reject', 'Submit to Client'].includes(
              planner.items[selectedItemIndex].approval.status
            )
          ) {
            planner.items[selectedItemIndex].approval.status = 'Client Reject';
          } else {
            return responseHelper(
              res,
              httpStatus.CONFLICT,
              true,
              `Unsupported action: ${action}. Please check the content(s) status`
            );
          }
          break;

        case 'rework':
          if (
            ['Client Reject', 'Client Rework', 'Submit to Client'].includes(
              planner.items[selectedItemIndex].approval.status
            )
          ) {
            planner.items[selectedItemIndex].approval.status = 'Client Rework';
          } else {
            return responseHelper(
              res,
              httpStatus.CONFLICT,
              true,
              `Unsupported action: ${action}. Please check the content(s) status`
            );
          }
          break;

        case 'approve':
          if (
            ['Client Approved', 'Client Rework', 'Submit to Client'].includes(
              planner.items[selectedItemIndex].approval.status
            )
          ) {
            planner.items[selectedItemIndex].approval.status =
              'Client Approved';
          } else {
            return responseHelper(
              res,
              httpStatus.CONFLICT,
              true,
              `Unsupported action: ${action}. Please check the content(s) status`
            );
          }
          break;
        default:
          return responseHelper(
            res,
            httpStatus.CONFLICT,
            true,
            `Unsupported action: ${action}. Please check the content(s) status`
          );
      }

      await planner.save();
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Approval status changed for bulk actions'
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

    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const socialMediaPlanner =
      await models.socialMediaPlannerModel.findById(planId);
    const selectedItem = socialMediaPlanner.items.find(
      (item) => item._id == itemId
    );
    if (selectedItem) {
      if (
        status === 'Client Approved' &&
        !['Submit to Client', 'Client Rework'].includes(
          selectedItem.approval.status
        )
      ) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          'Can not approve this post'
        );
      }

      if (
        status === 'Client Rework' &&
        !['Client Reject', 'Submit to Client', 'Client Rework'].includes(
          selectedItem.approval.status
        )
      ) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          'Can not Rework this post'
        );
      }

      if (
        status === 'Client Reject' &&
        !['Submit to Client', 'Client Rework', 'Client Reject'].includes(
          selectedItem.approval.status
        )
      ) {
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          'Can not Reject this post'
        );
      }

      selectedItem.approval.status = status;
      await socialMediaPlanner?.save();

      return responseHelper(
        res,
        httpStatus.OK,
        false,
        'Post status updated successfully.'
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
    const { projectId, postId, contentId } = req.params;
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
        { _id: postId, 'items._id': contentId },
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
    const { projectId, postId, contentId, commentId } = req.params;
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
      { _id: postId, 'items._id': contentId },
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
      httpStatus.CREATED,
      false,
      'post comment deleted successfully.'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

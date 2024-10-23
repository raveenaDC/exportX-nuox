import httpStatus from 'http-status';
import { paginateData } from '../../../utils/paginate-data.js';
import { responseHelper } from '../../../utils/response.helper.js';
import * as models from '../../../db/models/index.js';
import { Types } from 'mongoose';
const defaultPageLimit = process.env.PAGE_LIMIT;
import {
  startOfYear,
  startOfMonth,
  endOfMonth,
  endOfYear,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
/**
 * @returns {Array} projects status count,project with status
 */
export async function findProjects(req, res, next) {
  try {
    const { status, period } = req.query;

    let id;
    if (req.user.clientUserId) {
      const clientUser = await models.clientUserModel.findById(
        req.user.clientUserId
      );
      id = clientUser.clientId;
    } else {
      id = req.user.clientId;
    }

    let filter = {};
    if (status) {
      filter = { status: { $regex: new RegExp(status, 'i') } };
    }
    const projects = await models.projectModel.aggregate([
      { $match: { clientId: new Types.ObjectId(id) } },
      { $match: filter },
      {
        $lookup: {
          from: 'clientusers',
          localField: 'clientUsers.clientUser',
          foreignField: '_id',
          as: 'clientUsersDetails',
        },
      },
      {
        $addFields: {
          clientUsers: {
            $map: {
              input: '$clientUsers',
              as: 'element',
              in: {
                $mergeObjects: [
                  '$$element',
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$clientUsersDetails',
                          cond: { $eq: ['$$element.clientUser', '$$this._id'] },
                        },
                      },
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          clientUsers: {
            $map: {
              input: '$clientUsers',
              as: 'element',
              in: {
                // clientUser: '$$element.clientUser',
                // isClientCoordinator: '$$element.isClientCoordinator',
                _id: '$$element._id',
                clientUserName: '$$element.clientUserName',
                clientUserEmail: '$$element.clientUserEmail',
                clientUserImage: '$$element.clientUserImage.path',
                // view: '$$element.view',
                // action: '$$element.action',
              },
            },
          },
          startDate: 1,
          endDate: 1,
          status: 1,
          projectManager: {
            $arrayElemAt: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: '$projectCoordinators',
                      as: 'coordinator',
                      cond: { $eq: ['$$coordinator.isProjectManager', true] },
                    },
                  },
                  as: 'coordinator',
                  in: {
                    _id: '$$coordinator._id',
                    projectManager: '$$coordinator.projectCoordinator',
                    isProjectManager: '$$coordinator.isProjectManager',
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'projectManager.projectManager',
          foreignField: '_id',
          as: 'projectManagerDetails',
        },
      },
      {
        $addFields: {
          projectManager: {
            $mergeObjects: [
              '$projectManager',
              {
                $arrayElemAt: ['$projectManagerDetails', 0],
              },
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          clientUsers: 1,
          startDate: 1,
          endDate: 1,
          status: 1,
          projectManager: {
            _id: '$projectManager._id',
            firstName: '$projectManager.firstName',
            lastName: '$projectManager.lastName',
            email: '$projectManager.email',
            userImage: '$projectManager.userImage.path',
          },
        },
      },
    ]);
    const allProjects = await models.projectModel.find({
      clientId: id,
    });
    const allProjectStatuses = allProjects.map((project) => project.status);
    const socialMediaPlanWithItems = allProjects.flatMap(
      (project) => project?.contentPlanner?.socialMediaPlanner || []
    );
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
            const scheduledDate = item.scheduledDate
              ? new Date(item.scheduledDate).toISOString().split('T')[0]
              : null;
            const postIndex =
              postWithImageIndex === -1 ? 0 : postWithImageIndex;

            modifiedPlanItems.push({
              status: item.approval.status,
              comments: item.comments,
              scheduledDate: scheduledDate,
              post: item.posts[postIndex]?.post || '',
              image: item.posts[postIndex]?.images[0]?.path || '',
              itemId: item._id,
              planId,
            });
          });
        }
      }
    }

    const projectCounts = {
      total: allProjectStatuses.length,
      ongoing: allProjectStatuses.filter((status) => status === 'Ongoing')
        .length,
      completed: allProjectStatuses.filter((status) => status === 'Completed')
        .length,
      pending: allProjectStatuses.filter((status) => status === 'Pending')
        .length,
    };
    let socialMediaPlanner;
    let startDate, endDate;
    switch (period) {
      case 'weekly':
        startDate = startOfWeek(new Date());
        endDate = endOfWeek(new Date());
        break;
      case 'monthly':
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      case 'yearly':
        startDate = startOfYear(new Date());
        endDate = endOfYear(new Date());
        break;
    }
    if (!period) {
      socialMediaPlanner = modifiedPlanItems.filter(
        (item) => item.scheduledDate != null
      );
    } else {
      socialMediaPlanner = modifiedPlanItems.filter((item) => {
        const formattedDate = new Date(item.scheduledDate + 'T00:00:00.000Z');
        return (
          item.scheduledDate != null &&
          formattedDate >= startDate &&
          formattedDate <= endDate
        );
      });
    }

    return responseHelper(res, httpStatus.OK, false, 'Projects data', {
      projectCounts,
      projects,
      socialMediaPlanner,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

/**
 * @returns {Array} project
 */
export async function findAllProjects(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    let { status, search, order, orderBy, pageLimit } = req.query;
    pageLimit = parseInt(pageLimit || defaultPageLimit);
    //   const skip = (page - 1) * pageLimit;
    // const totalCount = await models.projectModel.countDocuments();
    // const totalPages = Math.ceil(totalCount / pageLimit);
    // const pageArray = Array.from(
    //    { length: totalPages },
    //     (_, index) => index + 1
    //  );

    let id;
    if (req.user.clientUserId) {
      const clientUser = await models.clientUserModel.findById(
        req.user.clientUserId
      );
      id = clientUser.clientId;
    } else {
      id = req.user.clientId;
    }

    let filter = {};
    if (status) {
      filter = { status: { $regex: new RegExp(status, 'i') } };
    } else if (search) {
      filter.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { status: { $regex: new RegExp(search, 'i') } },
      ];
    }

    let sortKey = {};
    const projectsPipeline = [
      { $match: { clientId: new Types.ObjectId(id) } },
      { $match: filter },
      // {$skip:skip},
      //  {$limit:pageLimit},
      {
        $lookup: {
          from: 'clientusers',
          localField: 'clientUsers.clientUser',
          foreignField: '_id',
          as: 'clientUsersDetails',
        },
      },
      {
        $addFields: {
          clientUsers: {
            $map: {
              input: '$clientUsers',
              as: 'element',
              in: {
                $mergeObjects: [
                  '$$element',
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$clientUsersDetails',
                          cond: { $eq: ['$$element.clientUser', '$$this._id'] },
                        },
                      },
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          clientUsers: {
            $map: {
              input: '$clientUsers',
              as: 'element',
              in: {
                // clientUser: '$$element.clientUser',
                // isClientCoordinator: '$$element.isClientCoordinator',
                _id: '$$element._id',
                clientUserName: '$$element.clientUserName',
                clientUserEmail: '$$element.clientUserEmail',
                clientUserImage: '$$element.clientUserImage.path',
                // view: '$$element.view',
                // action: '$$element.action',
              },
            },
          },
          startDate: 1,
          endDate: 1,
          status: 1,
          projectManager: {
            $arrayElemAt: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: '$projectCoordinators',
                      as: 'coordinator',
                      cond: { $eq: ['$$coordinator.isProjectManager', true] },
                    },
                  },
                  as: 'coordinator',
                  in: {
                    _id: '$$coordinator._id',
                    projectManager: '$$coordinator.projectCoordinator',
                    isProjectManager: '$$coordinator.isProjectManager',
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'projectManager.projectManager',
          foreignField: '_id',
          as: 'projectManagerDetails',
        },
      },
      {
        $addFields: {
          projectManager: {
            $mergeObjects: [
              '$projectManager',
              {
                $arrayElemAt: ['$projectManagerDetails', 0],
              },
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          clientUsers: 1,
          startDate: 1,
          endDate: 1,
          status: 1,
          projectManager: {
            _id: '$projectManager._id',
            firstName: '$projectManager.firstName',
            lastName: '$projectManager.lastName',
            email: '$projectManager.email',
            userImage: '$projectManager.userImage.path',
          },
        },
      },
    ];

    if (orderBy && order) {
      if (orderBy === 'projectName') {
        sortKey = { name: order === 'asc' ? 1 : -1 };
      } else if (orderBy === 'projectManager') {
        sortKey = { 'projectManager.firstName': order === 'asc' ? 1 : -1 };
      } else if (orderBy === 'startDate') {
        sortKey = { startDate: order === 'asc' ? 1 : -1 };
      } else if (orderBy === 'endDate') {
        sortKey = { endDate: order === 'asc' ? 1 : -1 };
      }
      projectsPipeline.push({ $sort: sortKey });
    }
    const projects = await models.projectModel.aggregate(projectsPipeline);
    const paginationResult = await paginateData(projects, page, pageLimit);
    //apply orderBy and order
    paginationResult.pagination.orderBy = orderBy;
    paginationResult.pagination.order = order;

    return responseHelper(res, httpStatus.OK, false, 'Projects data', {
      projects: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function findProjectById(req, res, next) {
  try {
    const { projectId } = req.params;

    let projects = await models.projectModel
      .findById(projectId)
      .select('name description startDate endDate documents images createdAt');
    if (!projects)
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found',
        {}
      );
    projects = projects.toObject();
    projects.startDate = new Date(projects.startDate)
      .toISOString()
      .split('T')[0];
    projects.endDate = new Date(projects.endDate).toISOString().split('T')[0];
    projects.createdAt = new Date(projects.createdAt)
      .toISOString()
      .split('T')[0];

    return responseHelper(res, httpStatus.OK, false, 'Projects data', projects);
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

import httpStatus from 'http-status';
import { responseHelper } from '../../../utils/response.helper.js';
import * as models from '../../../db/models/index.js';
const defaultPageLimit = process.env.PAGE_LIMIT;
import { paginateData } from '../../../utils/paginate-data.js';

export async function findAllDetails(req, res, next) {
  try {
    const { search } = req.query;
    const totalTasks = await models.taskModel.countDocuments();
    const completedTasks = await models.taskModel.countDocuments({
      status: {
        $in: [
          'Completed',
          'Submitted for Approval',
          'Approved',
          'Rework required',
        ],
      },
    });
    const pendingTasks = await models.taskModel.countDocuments({
      status: 'Pending',
    });
    const ongoingTasks = totalTasks - completedTasks - pendingTasks;
    const totalProjects = await models.projectModel.countDocuments();

    const projectsQuery = models.projectModel
      .find()
      .populate({ path: 'clientId', select: 'firstName lastName clientImage' })
      .populate({
        path: 'projectCoordinators.projectCoordinator',
        select: 'firstName lastName userImage',
      })
      .select('name clientId projectCoordinators startDate endDate status');

    let projects;
    switch (search) {
      case 'completed':
        projectsQuery
          .where('status')
          .in([
            'Completed',
            'Submitted for Approval',
            'Approved',
            'Rework required',
          ]);
        projects = await projectsQuery.exec();
        break;
      case 'pending':
        projectsQuery.where('status').equals('Pending');
        projects = await projectsQuery.exec();
        break;
      case 'ongoing':
        projectsQuery.where('status').equals('Ongoing');
        projects = await projectsQuery.exec();
        break;
      default:
        projects = await projectsQuery.limit(4).exec();
        break;
    }

    const tasks = await models.taskModel
      .find()
      .populate({ path: 'projectId', select: 'name' })
      .populate({ path: 'assignees', select: 'firstName lastName userImage' })
      .select('name projectId assignees status')
      .limit(5);

    const pendingTasksPercentage = Math.round(
      (pendingTasks / totalTasks) * 100
    );
    const completedTasksPercentage = Math.round(
      (completedTasks / totalTasks) * 100
    );
    const ongoingTasksPercentage = Math.round(
      (ongoingTasks / totalTasks) * 100
    );
    const monthlyProjectGraph = await models.projectModel.aggregate([
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const yearlyProjectGraph = await models.projectModel.aggregate([
      {
        $group: {
          _id: { $year: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id',
          count: 1,
        },
      },
    ]);

    const formattedMonthlyProjectCount = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthName = new Date(2000, i, 1).toLocaleString('en-US', {
        month: 'long',
      });
      const found = monthlyProjectGraph.find(
        (item) => item._id.month === month
      );
      return { month: monthName, count: found ? found.count : 0 };
    });

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Details fetched successfully.',
      {
        totalTasks,
        completedTasks,
        totalProjects,
        projects,
        tasks,
        taskOverview: {
          pendingTasksPercentage: `${pendingTasksPercentage}%`,
          completedTasksPercentage: `${completedTasksPercentage}%`,
          ongoingTasksPercentage: `${ongoingTasksPercentage}%`,
        },
        monthlyProjectGraph: formattedMonthlyProjectCount,
        yearlyProjectGraph,
      }
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function viewAllProjects(req, res, next) {
  try {
    let { page, pageLimit, sortBy, order, search, status } = req.query;

    page = parseInt(page) || 1;
    pageLimit = parseInt(pageLimit) || defaultPageLimit;

    let sortOptions = {};

    if (sortBy) {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    }

    let aggregationPipeline = [];

    aggregationPipeline.push({
      $lookup: {
        from: 'clients',
        localField: 'clientId',
        foreignField: '_id',
        as: 'client',
      },
    });

    aggregationPipeline.push({
      $lookup: {
        from: 'users',
        localField: 'projectCoordinators.projectCoordinator',
        foreignField: '_id',
        as: 'projectCoordinators',
      },
    });

    aggregationPipeline.push({
      $unwind: '$client',
    });

    aggregationPipeline.push({
      $project: {
        name: 1,
        projectCoordinators: {
          $map: {
            input: '$projectCoordinators',
            as: 'coordinator',
            in: {
              firstName: '$$coordinator.firstName',
              lastName: '$$coordinator.lastName',
              userImage: '$$coordinator.userImage',
            },
          },
        },
        startDate: 1,
        endDate: 1,
        status: 1,
        'client._id': 1,
        'client.firstName': 1,
        'client.lastName': 1,
        'client.clientImage': 1,
      },
    });

    if (search) {
      aggregationPipeline.push({
        $match: {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            {
              $expr: {
                $regexMatch: {
                  input: {
                    $concat: ['$client.firstName', ' ', '$client.lastName'],
                  },
                  regex: new RegExp(search, 'i'),
                },
              },
            },
            { 'client.firstName': { $regex: search, $options: 'i' } },
            { 'client.lastName': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    if (status && status !== 'all') {
      let statusMatch;
      if (status === 'completed') {
        statusMatch = { $eq: ['$status', 'Completed'] };
      } else if (status === 'pending') {
        statusMatch = { $eq: ['$status', 'Pending'] };
      } else if (status === 'ongoing') {
        statusMatch = { $eq: ['$status', 'Ongoing'] };
      }
      aggregationPipeline.push({
        $match: {
          $expr: statusMatch,
        },
      });
    }

    const totalCountPipeline = [...aggregationPipeline];
    totalCountPipeline.push({ $count: 'totalCount' });
    const [totalProjectsCount] =
      await models.projectModel.aggregate(totalCountPipeline);

    const totalCount = totalProjectsCount ? totalProjectsCount.totalCount : 0;
    const totalPages = Math.ceil(totalCount / pageLimit);

    aggregationPipeline.push(
      { $skip: (page - 1) * parseInt(pageLimit) },
      { $limit: parseInt(pageLimit) }
    );

    const projects = await models.projectModel.aggregate(aggregationPipeline);

    const paginationResult = paginateData(projects, page, pageLimit);

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Projects fetched successfully.',
      {
        projects: paginationResult.data,
        pagination: {
          totalProjects: totalCount,
          totalPages,
          currentPage: page,
          pageLimit,
        },
      }
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function viewAllTasks(req, res, next) {
  try {
    let { page, pageLimit, sortBy, order, search, status } = req.query;

    page = parseInt(page) || 1;
    pageLimit = parseInt(pageLimit) || defaultPageLimit;

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    }

    let aggregationPipeline = [];

    aggregationPipeline.push({
      $lookup: {
        from: 'projects',
        localField: 'projectId',
        foreignField: '_id',
        as: 'project',
      },
    });

    aggregationPipeline.push({
      $lookup: {
        from: 'users',
        localField: 'assignees',
        foreignField: '_id',
        as: 'assignees',
      },
    });

    aggregationPipeline.push({
      $unwind: '$project',
    });

    aggregationPipeline.push({
      $unwind: '$assignees',
    });

    const matchStage = {};

    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'project.name': { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      if (status === 'inprogress') {
        matchStage.status = 'In Progress';
      } else {
        matchStage.status = status.charAt(0).toUpperCase() + status.slice(1);
      }
      aggregationPipeline.push({
        $match: {
          $expr: statusMatch,
        },
      });
    }

    if (Object.keys(matchStage).length > 0) {
      aggregationPipeline.push({ $match: matchStage });
    }

    if (Object.keys(sortOptions).length > 0) {
      aggregationPipeline.push({ $sort: sortOptions });
    }

    aggregationPipeline.push({
      $project: {
        name: 1,
        'project._id': 1,
        'project.name': 1,
        'assignees.firstName': 1,
        'assignees.lastName': 1,
        'assignees.userImage': 1,
        status: 1,
      },
    });

    const totalCountPipeline = [...aggregationPipeline];
    totalCountPipeline.push({ $count: 'totalCount' });
    const [totalTasksCount] =
      await models.taskModel.aggregate(totalCountPipeline);

    const totalCount = totalTasksCount ? totalTasksCount.totalCount : 0;
    const totalPages = Math.ceil(totalCount / pageLimit);

    aggregationPipeline.push(
      { $skip: (page - 1) * parseInt(pageLimit) },
      { $limit: parseInt(pageLimit) }
    );
    const tasks = await models.taskModel.aggregate(aggregationPipeline);
    const paginationResult = paginateData(tasks, page, pageLimit);

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Tasks fetched successfully.',
      {
        tasks: paginationResult.data,
        pagination: {
          totalTasks: totalCount,
          totalPages,
          currentPage: page,
          pageLimit,
        },
      }
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function updateProjectStatus(req, res, next) {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    if (!status) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'Status is required.'
      );
    }
    const updatedProject = await models.projectModel
      .findByIdAndUpdate(projectId, { status }, { new: true })
      .populate({
        path: 'clientId',
        select: 'firstName lastName clientImage',
      })
      .populate({
        path: 'projectCoordinators.projectCoordinator',
        select: 'firstName lastName userImage',
      });

    if (!updatedProject) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found.'
      );
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `Project status updated to ${status} successfully.`,
      updatedProject
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function updateTaskStatus(req, res, next) {
  try {
    const { projectId, taskId } = req.params;
    const { status } = req.body;

    const updatedTask = await models.taskModel
      .findOneAndUpdate(
        { _id: taskId, projectId: projectId },
        { status: status },
        { new: true }
      )
      .populate({
        path: 'projectId',
        select: 'name',
      })
      .populate({
        path: 'assignees',
        select: 'firstName lastName userImage',
      });

    if (!updatedTask) {
      return responseHelper(res, httpStatus.NOT_FOUND, true, 'Task not found');
    }

    const updatedProject = await models.projectModel
      .findById(projectId)
      .populate({
        path: 'tasks',
        populate: {
          path: 'assignees',
          select: 'firstName lastName userImage',
        },
      });

    if (!updatedProject) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `Task status updated  to ${status} successfully.`,
      { updatedTask, updatedProject }
    );
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

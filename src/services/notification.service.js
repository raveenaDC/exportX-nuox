import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
import * as models from '../db/models/index.js';
import { paginateData } from '../utils/paginate-data.js';
const defaultPageLimit = process.env.PAGE_LIMIT;

export async function getAllUnread(req, res, next) {
  try {
    const { userId } = req.user;
    let { pageLimit, page } = req.query;
    pageLimit = parseInt(pageLimit || defaultPageLimit);
    page = parseInt(page || 1);

    if (userId) {
      const notifications = await models.notificationModel
        .find({ createdForUser: userId, isRead: false })
        .sort({ createdAt: 'desc' })
        .select(
          'createdByUser createdByClient createdByClientUser content isRead createdAt'
        )
        .populate({
          path: 'createdByUser',
          select: 'userImage firstName lastName',
        })
        .populate({
          path: 'createdByClient',
          select: 'clientImage firstName lastName',
        })
        .populate({
          path: 'createdByClientUser',
          select: 'clientUserImage clientUserName',
        });
      const formattedNotifications = notifications.map((item) => {
        const date = new Date(item.createdAt);
        const formattedDate = date.toISOString().split('T')[0];
        const formattedTime = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'UTC',
        });

        return {
          ...item.toObject(),
          date: formattedDate,
          time: formattedTime,
        };
      });
      const paginationResult = paginateData(
        formattedNotifications,
        page,
        pageLimit
      );
      return responseHelper(res, httpStatus.OK, false, 'notifications', {
        pagination: paginationResult.pagination,
        notifications: paginationResult.data,
      });
    } else {
      return responseHelper(res, httpStatus.CONFLICT, false, 'Invalid login');
    }
  } catch (error) {
    return next(new Error(error));
  }
}
export async function getAllForUsers(req, res, next) {
  try {
    const { userId } = req.user;
    let { pageLimit, page } = req.query;
    pageLimit = parseInt(pageLimit || defaultPageLimit);
    page = parseInt(page || 1);
    if (userId) {
      const notifications = await models.notificationModel
        .find({ createdForUser: userId })
        .sort({ createdAt: 'desc' })
        .select(
          'createdByUser createdByClient createdByClientUser content isRead createdAt'
        )
        .populate({
          path: 'createdByUser',
          select: 'userImage firstName lastName',
        })
        .populate({
          path: 'createdByClient',
          select: 'clientImage firstName lastName',
        })
        .populate({
          path: 'createdByClientUser',
          select: 'clientUserName clientUserImage ',
        });
      const formattedNotifications = notifications.map((item) => {
        const date = new Date(item.createdAt);
        const formattedDate = date.toISOString().split('T')[0];
        const formattedTime = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'UTC',
        });

        return {
          ...item.toObject(),
          date: formattedDate,
          time: formattedTime,
        };
      });
      const paginationResult = paginateData(
        formattedNotifications,
        page,
        pageLimit
      );
      return responseHelper(res, httpStatus.OK, false, 'notifications', {
        pagination: paginationResult.pagination,
        notifications: paginationResult.data,
      });
    } else {
      return responseHelper(res, httpStatus.CONFLICT, false, 'Invalid login');
    }
  } catch (error) {
    return next(new Error(error));
  }
}
// export async function getAllUnreadForClient(req, res, next) {
//   try {
//     const { clientId } = req.user;
//     let { pageLimit, page } = req.query;
//     pageLimit = parseInt(pageLimit || defaultPageLimit);
//     page = parseInt(page || 1);
//     if (clientId) {
//       const notifications = await models.notificationModel
//         .find({ createdForClient: clientId, isRead: false })
//         .sort({ createdAt: 'desc' })
//         .select(
//           'createdByUser createdByClient createdByClientUser content isRead createdAt'
//         )
//         .populate({
//           path: 'createdByUser',
//           select: 'userImage firstName lastName',
//         })
//         .populate({
//           path: 'createdByClient',
//           select: 'clientImage firstName lastName',
//         })
//         .populate({
//           path: 'createdByClientUser',
//           select: 'clientUserImage clientUserName',
//         });

//       const paginationResult = paginateData(notifications, page, pageLimit);

//       return responseHelper(res, httpStatus.OK, false, 'notifications', {
//         pagination: paginationResult.pagination,
//         notifications: paginationResult.data,
//       });
//     } else {
//       return responseHelper(
//         res,
//         httpStatus.UNAUTHORIZED,
//         false,
//         'Invalid login'
//       );
//     }
//   } catch (error) {
//     return next(new Error(error));
//   }
// }
export async function getAllUnreadForClientUser(req, res, next) {
  try {
    const { clientUserId, clientId } = req.user;
    let { pageLimit, page } = req.query;
    pageLimit = parseInt(pageLimit || defaultPageLimit);
    page = parseInt(page || 1);
    let query = {};
    if (clientUserId) {
      query = { createdForClientUser: clientUserId };
    } else if (clientId) {
      query = { createdForClient: clientId };
    } else {
      return responseHelper(res, httpStatus.CONFLICT, false, 'Invalid login');
    }
    const notifications = await models.notificationModel
      .find({ ...query, isRead: false })
      .sort({ createdAt: 'desc' })
      .select(
        'createdByUser createdByClient createdByClientUser content isRead createdAt'
      )
      .populate({
        path: 'createdByUser',
        select: 'userImage firstName lastName',
      })
      .populate({
        path: 'createdByClient',
        select: 'clientImage firstName lastName',
      })
      .populate({
        path: 'createdByClientUser',
        select: 'clientUserImage clientUserName',
      });

    const formattedNotifications = notifications.map((item) => {
      const date = new Date(item.createdAt);
      const formattedDate = date.toISOString().split('T')[0];
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
      });

      return {
        ...item.toObject(),
        date: formattedDate,
        time: formattedTime,
      };
    });
    const paginationResult = paginateData(
      formattedNotifications,
      page,
      pageLimit
    );

    return responseHelper(res, httpStatus.OK, false, 'notifications', {
      pagination: paginationResult.pagination,
      notifications: paginationResult.data,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

// For Admin or PM
// export async function getAllNotifications(req, res, next) {
//   try {
//     if (req.user.role != 'admin' && req.user.role != 'Project Manager') {
//       return responseHelper(
//         res,
//         httpStatus.UNAUTHORIZED,
//         true,
//         'You have no permission to view this notification'
//       );
//     }
//     let { pageLimit, page } = req.query;
//     pageLimit = parseInt(pageLimit || defaultPageLimit);
//     page = parseInt(page || 1);
//     const notifications = await models.notificationModel
//       .find()
//       .sort({ createdAt: 'desc' })
//       .select('content isRead createdAt');

//     const paginationResult = paginateData(notifications, page, pageLimit);

//     return responseHelper(res, httpStatus.OK, false, 'notifications', {
//       pagination: paginationResult.pagination,
//       notifications: paginationResult.data,
//     });
//   } catch (error) {
//     return next(new Error(error));
//   }
// }

// export async function getNotificationsForClient(req, res, next) {
//   try {
//     const { clientId } = req.user;
//     let { pageLimit, page } = req.query;
//     pageLimit = parseInt(pageLimit || defaultPageLimit);
//     page = parseInt(page || 1);
//     if (clientId) {
//       const notifications = await models.notificationModel
//         .find({ createdForClient: clientId })
//         .sort({ createdAt: 'desc' })
//         .select(
//           'createdByUser createdByClient createdByClientUser content isRead createdAt'
//         )
//         .populate({
//           path: 'createdByUser',
//           select: 'userImage firstName lastName',
//         })
//         .populate({
//           path: 'createdByClient',
//           select: 'clientImage firstName lastName',
//         })
//         .populate({
//           path: 'createdByClientUser',
//           select: 'clientUserImage clientUserName',
//         });

//       const paginationResult = paginateData(notifications, page, pageLimit);

//       return responseHelper(res, httpStatus.OK, false, 'notifications', {
//         pagination: paginationResult.pagination,
//         notifications: paginationResult.data,
//       });
//     } else {
//       return responseHelper(
//         res,
//         httpStatus.UNAUTHORIZED,
//         false,
//         'Invalid login'
//       );
//     }
//   } catch (error) {
//     return next(new Error(error));
//   }
// }

export async function getNotificationsForClientUser(req, res, next) {
  try {
    const { clientUserId, clientId } = req.user;
    let { pageLimit, page } = req.query;
    pageLimit = parseInt(pageLimit || defaultPageLimit);
    page = parseInt(page || 1);
    let notificationsQuery = {};
    if (clientUserId) {
      notificationsQuery.createdForClientUser = clientUserId;
    } else if (clientId) {
      notificationsQuery.createdForClient = clientId;
    } else {
      return responseHelper(res, httpStatus.CONFLICT, false, 'Invalid login');
    }

    const notifications = await models.notificationModel
      .find(notificationsQuery)
      .sort({ createdAt: 'desc' })
      .select(
        'createdByUser createdByClient createdByClientUser content isRead createdAt'
      )
      .populate({
        path: 'createdByUser',
        select: 'userImage firstName lastName',
      })
      .populate({
        path: 'createdByClient',
        select: 'clientImage firstName lastName',
      })
      .populate({
        path: 'createdByClientUser',
        select: 'clientUserImage clientUserName',
      });

    const formattedNotifications = notifications.map((item) => {
      const date = new Date(item.createdAt);
      const formattedDate = date.toISOString().split('T')[0];
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
      });

      return {
        ...item.toObject(),
        date: formattedDate,
        time: formattedTime,
      };
    });
    const paginationResult = paginateData(
      formattedNotifications,
      page,
      pageLimit
    );

    return responseHelper(res, httpStatus.OK, false, 'notifications', {
      pagination: paginationResult.pagination,
      notifications: paginationResult.data,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { userId, clientId, clientUserId } = req.user;
    const { notificationIds } = req.body;

    await models.notificationModel.updateMany(
      {
        _id: { $in: notificationIds },
        $or: [
          { createdForUser: userId },
          { createdForClient: clientId },
          { createdForClientUser: clientUserId },
        ],
      },
      { $set: { isRead: true } }
    );
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'notifications are marked as read successfully'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

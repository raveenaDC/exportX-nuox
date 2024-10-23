import { Router } from 'express';
import * as notificationService from '../services/notification.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';

const notificationRoute = Router();

notificationRoute.get(
  '/',
  middlewares.authenticateMiddleWare,
  notificationService.getAllUnread
);
notificationRoute.get(
  '/view',
  middlewares.authenticateMiddleWare,
  notificationService.getAllForUsers
);
// notificationRoute.get(
//   '/unread/client',
//   middlewares.authenticateMiddleWare,
//   notificationService.getAllUnreadForClient
// );
notificationRoute.get(
  '/unread/client-user',
  middlewares.authenticateMiddleWare,
  notificationService.getAllUnreadForClientUser
);
// notificationRoute.get(
//   '/all',
//   middlewares.authenticateMiddleWare,
//   notificationService.getAllNotifications
// );
notificationRoute.get(
  '/client-user',
  middlewares.authenticateMiddleWare,
  notificationService.getNotificationsForClientUser
);
// notificationRoute.get(
//   '/client',
//   middlewares.authenticateMiddleWare,
//   notificationService.getNotificationsForClient
// );

notificationRoute.patch(
  '/mark-as-read',
  middlewares.authenticateMiddleWare,
  validators.notificationMarkAsReadValidator,
  middlewares.validationCheckMiddleWare,
  notificationService.markAsRead
);

export default notificationRoute;

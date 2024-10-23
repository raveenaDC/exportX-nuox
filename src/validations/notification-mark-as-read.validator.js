import { body } from 'express-validator';
export default [
  body('notificationIds').notEmpty().withMessage('notificationIds required'),
];

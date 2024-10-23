import { body } from 'express-validator';

export default [
  body('clientUserName').notEmpty().withMessage('Client user name required'),
  body('clientUserEmail')
    .notEmpty()
    .withMessage('Client user email required')
    .isEmail()
    .withMessage('Invalid email format'),
  body('clientId').notEmpty().withMessage('Client Id required'),
];

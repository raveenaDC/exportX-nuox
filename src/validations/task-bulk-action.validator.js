import { body } from 'express-validator';

export default [
  body('tasks')
    .notEmpty()
    .withMessage('tasks are required')
    .isArray({ min: 1 })
    .withMessage('Choose at least one task'),
  body('action')
    .notEmpty()
    .withMessage('action is required')
    .isIn(['Submit For Approval', 'Rework required', 'Approved'])
    .withMessage(
      "action must be 'Submit For Approval', 'Rework required' or 'Approved' "
    ),
];

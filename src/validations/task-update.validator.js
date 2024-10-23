import { body } from 'express-validator';

export default [
  body('type').notEmpty().withMessage('type is required'),
  body('name').notEmpty().withMessage('name is required'),
  // body('stage').notEmpty().withMessage('stage is required'),
  body('note').notEmpty().withMessage('note is required'),
  body('assignees')
    .optional()
    .isArray({ min: 1 })
    .withMessage('choose atleast one assignee'),
];

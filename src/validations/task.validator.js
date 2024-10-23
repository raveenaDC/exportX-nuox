import { body } from 'express-validator';

export default [
  body('projectId').notEmpty().withMessage('projectId is required'),
  body('type').notEmpty().withMessage('type is required'),
  body('name').notEmpty().withMessage('name is required'),
  body('stage').notEmpty().withMessage('stage is required'),
  body('note').notEmpty().withMessage('note is required'),
  //check assignees is required and is an array with at least on element
  body('assignees')
    .notEmpty()
    .withMessage('assignees are required')
    .isArray({ min: 1 })
    .withMessage('choose atleast one assignee'),
];

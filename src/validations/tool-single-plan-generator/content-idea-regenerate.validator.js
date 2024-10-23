import { body } from 'express-validator';

export default [
  body('title').notEmpty().withMessage('title is required'),
  body('content').notEmpty().withMessage('content is required'),
];

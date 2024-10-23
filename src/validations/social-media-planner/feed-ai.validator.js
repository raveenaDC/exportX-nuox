import { body } from 'express-validator';

export default [
  body('projectBrief').notEmpty().withMessage('projectBrief is required'),
  body('clientBrief').notEmpty().withMessage('clientBrief is required'),
  body('tagIdeas').notEmpty().withMessage('tagIdeas is required'),
  body('projectBrief').notEmpty().withMessage('projectBrief is required'),
];

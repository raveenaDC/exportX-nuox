import { body } from 'express-validator';

export default [
  body('settings').notEmpty().withMessage('settings is required'),
  body('settings.languages')
    .notEmpty()
    .withMessage('settings.languages is required'),
  body('settings.platforms')
    .notEmpty()
    .withMessage('settings.platforms is required'),
  body('settings.aiTool').notEmpty().withMessage('settings.aiTool is required'),
];

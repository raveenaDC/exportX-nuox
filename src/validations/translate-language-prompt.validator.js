import { body } from 'express-validator';

export default [
  body('language').notEmpty().withMessage('Language is required'),
  body('prompt')
    .notEmpty()
    .withMessage('Prompt is required')
    .isLength({ max: 500 })
    .withMessage('Prompt must not exceed 500 characters'),
];

import { body } from 'express-validator';

export default [
  body('dallePrompt').notEmpty().withMessage('dallePrompt is  required'),
];

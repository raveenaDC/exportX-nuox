import { body } from 'express-validator';

export default [
  body('imageIdeas').notEmpty().withMessage('imageIdeas required'),
  body('dallePrompt').notEmpty().withMessage('dallePrompt required'),
  body('posts').notEmpty().withMessage('posts required'),
];

import { body } from 'express-validator';
export default [
  body('project').notEmpty().withMessage('Project name required'),
  body('language').notEmpty().withMessage('Laguage required'),
  body('platform').notEmpty().withMessage('Platform required'),
  body('tool')
    .notEmpty()
    .withMessage('Ai tool required')
    .isIn(['openAi', 'bardAi'])
    .withMessage('Ai tool must be either open-ai or bard-ai'),
  body('prompt').notEmpty().withMessage('Prompt required'),
  body('toneOfVoice').notEmpty().withMessage('Tone of voice required'),
  body('targetAudience').notEmpty().withMessage('Target audience required'),
];

import { body } from 'express-validator';

export default [
  body('language').notEmpty().withMessage('Language is required.'),
  body('subject').notEmpty().withMessage('Subject is required.'),
  body('toneOfVoice').notEmpty().withMessage('Tone of Voice is required.'),
  body('targetAudience').notEmpty().withMessage('Target Audience is required.'),
  body('output').notEmpty().withMessage('Generated ideas are required.'),
];

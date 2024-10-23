import { body } from 'express-validator';
export default [
  body('language').notEmpty().withMessage('Laguage required'),
  body('subject').notEmpty().withMessage('Subject required'),
  // body('keyPoints').notEmpty().withMessage('Key points required'),
  body('toneOfVoice').notEmpty().withMessage('Tone of voice required'),
  body('targetAudience').notEmpty().withMessage('Target audience required'),
];

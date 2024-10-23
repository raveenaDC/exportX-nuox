import { body } from 'express-validator';

export default [
  body('language').notEmpty().withMessage('Language is required.'),
  body('project').notEmpty().withMessage('Project is required.'),
  body('aiTool').notEmpty().withMessage('AI Tool is required.'),
  body('prompt').notEmpty().withMessage('Prompt is required.'),
  body('platform').notEmpty().withMessage('Platform is required.'),
  body('toneOfVoice').notEmpty().withMessage('Tone of Voice is required.'),
  body('targetAudience').notEmpty().withMessage('Target Audience is required.'),
  body('output').notEmpty().withMessage('Generated ideas are required.'),
];

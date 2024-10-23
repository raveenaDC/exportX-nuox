import { body } from 'express-validator';

export default [
  body('adGoals').notEmpty().withMessage('adGolas required'),
  body('toneOfVoice').notEmpty().withMessage('ToneOfVoice required'),
  body('targetAudience').notEmpty().withMessage('TargetAudience required'),
  body('productServiceName')
    .notEmpty()
    .withMessage('ProductServiceName required'),
  body('briefDescription').notEmpty().withMessage('BriefDescription required'),
];

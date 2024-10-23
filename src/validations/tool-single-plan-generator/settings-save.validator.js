import { body } from 'express-validator';

export default [
  body('settings').notEmpty().withMessage('settings required'),
  body('adGoals').notEmpty().withMessage('adGoals required'),
  body('toneOfVoice').notEmpty().withMessage('toneOfVoice required'),
  body('targetAudience').notEmpty().withMessage('targetAudience required'),
  body('productServiceName')
    .notEmpty()
    .withMessage('productServiceName required'),
  body('briefDescription').notEmpty().withMessage('briefDescription required'),
];

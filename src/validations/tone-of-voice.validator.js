import { body } from 'express-validator';
export default [
  body('toneOfVoice').notEmpty().withMessage('toneOfVoice required'),
];

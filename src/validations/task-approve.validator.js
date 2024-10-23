import { body } from 'express-validator';

export default [
  body('approval')
    .notEmpty()
    .withMessage('approval is required')
    .isIn(['Rework required', 'Approved'])
    .withMessage("approval must be 'Rework required' or 'Approved' "),
];

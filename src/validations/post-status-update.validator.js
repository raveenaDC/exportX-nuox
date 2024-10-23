import { body } from 'express-validator';

export default [
  body('status')
    .notEmpty()
    .withMessage('status is  required')
    .isIn(['Approved', 'Rework', 'Rejected'])
    .withMessage("status must be one of 'Approved', 'Rework', 'Rejected'"),
];

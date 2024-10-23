import { body } from 'express-validator';

export default [
  body('status')
    .notEmpty()
    .withMessage('status is  required')
    .isIn(['ApprovedByClient', 'ReworkByClient', 'RejectedByClient'])
    .withMessage(
      "status must be one of 'ApprovedByClient', 'ReworkByClient', 'RejectedByClient'"
    ),
];

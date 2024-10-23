import { body } from 'express-validator';
//stage renamed to status
export default [
  body('status')
    .notEmpty()
    .withMessage('status is required')
    .isIn([
      'Pending',
      'In Progress',
      'Completed',
      'Submit For Approval',
      'Approved',
      'Rework required',
    ])
    .withMessage(
      "status must be any of 'Pending' 'In Progress' 'Completed' 'Submit For Approval' 'Approved' 'Rework required' "
    ),
];

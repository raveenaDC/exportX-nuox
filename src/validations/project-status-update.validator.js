import { body } from 'express-validator';

export default [
  body('status')
    .isIn([
      'Ongoing',
      'Completed',
      'Pending',
      'Submitted for Approval',
      'Approved',
      'Rework required',
    ])
    .withMessage(
      " status must be any of 'Ongoing', 'Completed', 'Pending', 'Submitted for Approval','Approved','Rework required' "
    ),
];

import { query } from 'express-validator';

// export default [
//  query('action')
//  .isIn(['approve', 'submitToClient', 'rework', 'reject', 'schedule'])
//  .withMessage(
//    'Invalid status. Should be one of: approve, submitToClient, rework, reject, schedule'
//  ),
// ];
export default [
  query('action')
    .isIn(['ApprovedByClient', 'ReworkByClient', 'RejectedByClient'])
    .withMessage(
      'Invalid status. Should be one of: RejectedByClient, ReworkByClient, ApprovedByClient'
    ),
];

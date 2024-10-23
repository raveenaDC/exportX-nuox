import { query } from 'express-validator';

export default [
  query('status')
    .optional()
    .isIn(['all', 'recentlySubmited', 'approved', 'scheduled', 'rejected'])
    .withMessage(
      'Invalid status. Should be one of: all, recentlySubmited, approved, rejected, scheduled'
    ),
];

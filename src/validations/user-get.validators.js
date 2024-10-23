import { query } from 'express-validator';

export default [
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage("order must be any of 'asc' 'desc' "),
  query('orderBy')
    .optional()
    .isIn(['name', 'designation'])
    .withMessage("order must be any of  'name'  'designation' "),
];

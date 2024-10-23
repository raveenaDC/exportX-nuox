import { query } from 'express-validator';

export default [
  query('period')
    .if(query('period').exists())
    .isIn(['monthly', 'weekly', 'yearly'])
    .withMessage("period must be any of  'monthly'  'weekly' 'yearly' "),
];

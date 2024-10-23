import { query } from 'express-validator';

export default [
  query('period')
    .if(query('period').exists())
    .isIn(['monthly', 'quarterly', 'yearly'])
    .withMessage("period must be any of  'monthly'  'quarterly' 'yearly' "),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage("order must be any of 'asc' 'desc' "),
  query('orderBy')
    .optional()
    .isIn(['name', 'clientId', 'startDate', 'endDate'])
    .withMessage(
      "orderBy must be any of  'name'  'clientId' 'startDate' 'endDate' "
    ),
];

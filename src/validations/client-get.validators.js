import { query } from 'express-validator';

export default [
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage("order must be any of 'asc' 'desc' "),
  query('orderBy')
    .optional()
    .isIn(['clientName', 'companyName', 'companyUrl'])
    .withMessage(
      "order must be any of  'clientName'  'companyName' 'companyUrl'"
    ),
];

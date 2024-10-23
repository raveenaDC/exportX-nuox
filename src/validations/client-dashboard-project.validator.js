import { query } from 'express-validator';
export default [
  query('status')
    .if(query('status').exists())
    .isIn(['Ongoing', 'Completed', 'Pending'])
    .withMessage(" status must be any of 'Ongoing', 'Completed', 'Pending' "),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage("order must be any of 'asc' 'desc' "),
  query('orderBy')
    .optional()
    .isIn(['projectName', 'projectManager', 'startDate', 'endDate'])
    .withMessage(
      "orderBy must be any of  'projectName'  'projectManager' 'startDate' 'endDate' "
    ),
];

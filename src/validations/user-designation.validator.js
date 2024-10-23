import { body } from 'express-validator';
export default [
  body('designation').notEmpty().withMessage('designation required'),
];

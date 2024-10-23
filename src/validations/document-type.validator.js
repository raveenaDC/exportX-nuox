import { body } from 'express-validator';

export default [
  body('documentType').notEmpty().withMessage('documentType is required'),
];

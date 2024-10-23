import { body } from 'express-validator';

export default [
  body('productServiceName')
    .notEmpty()
    .withMessage('productServiceName required'),
  body('description').notEmpty().withMessage('description required'),
];

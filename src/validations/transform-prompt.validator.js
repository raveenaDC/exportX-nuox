import { body } from 'express-validator';

export default [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .matches(/^[A-Za-z\s]+$/)
    .withMessage('Name must contain only letters and spaces'),
  body('prompt')
    .notEmpty()
    .withMessage('Prompt is required')
    .isLength({ max: 500 })
    .withMessage('Prompt must not exceed 500 characters'),
];

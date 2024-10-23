import { param } from 'express-validator';

export default [
  param('email')
    .notEmpty()
    .withMessage('Email is required')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Invalid email format')
    .isEmail()
    .withMessage('Invalid email format'),
];

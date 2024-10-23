import { query } from 'express';
import { body } from 'express-validator';

export default [
  body('emptyTemplate').notEmpty().withMessage('template is  required'),
];

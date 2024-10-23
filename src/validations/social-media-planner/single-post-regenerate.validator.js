import { body } from 'express-validator';

export default [body('post').notEmpty().withMessage('post is required')];

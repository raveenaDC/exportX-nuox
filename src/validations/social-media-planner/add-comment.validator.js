import { body } from 'express-validator';

export default [body('comment').notEmpty().withMessage('comment is required')];

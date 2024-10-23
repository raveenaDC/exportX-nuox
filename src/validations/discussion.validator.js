import { body } from 'express-validator';

export default [body('message').notEmpty().withMessage('message required')];

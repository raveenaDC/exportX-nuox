import { body, param } from 'express-validator';

export default [body('user').notEmpty().withMessage('user is required')];

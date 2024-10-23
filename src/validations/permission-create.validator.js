import { body } from 'express-validator';

export default [body('roleId').notEmpty().withMessage('roleId required')];

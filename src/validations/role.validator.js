import { body } from 'express-validator';

export default [body('roleName').notEmpty().withMessage('Role Name required')];

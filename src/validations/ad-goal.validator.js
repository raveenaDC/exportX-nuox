import { body } from 'express-validator';
export default [body('adGoal').notEmpty().withMessage('adGoal required')];

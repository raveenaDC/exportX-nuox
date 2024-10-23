import { body } from 'express-validator';

export default [
  body('active')
    .notEmpty()
    .withMessage('active is required')
    .isIn([true, false])
    .withMessage('active must be true or false'),
];

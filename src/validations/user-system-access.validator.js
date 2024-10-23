import { body } from 'express-validator';

export default [
  body('systemAccess')
    .notEmpty()
    .withMessage('systemAccess required')
    .isIn([true, false])
    .withMessage("systemAccess must be 'true' or 'false'"),
];

import { body } from 'express-validator';
export default [
  body('newName')
    .notEmpty()
    .withMessage('newName required')
    .custom((value) => {
      if (value.includes(' ')) {
        throw new Error('document name cannot contain spaces');
      }
      return true;
    }),
];

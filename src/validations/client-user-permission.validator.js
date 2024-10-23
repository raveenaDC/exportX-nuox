import { body } from 'express-validator';

export default [
  body('action')
    .if(body('action').exists())
    .custom((value) => {
      if (typeof value !== 'boolean') {
        throw new Error("view must be a boolean value ('true' or 'false')");
      }
      return true;
    }),
  body('view')
    .if(body('view').exists())
    .custom((value) => {
      if (typeof value !== 'boolean') {
        throw new Error("view must be a boolean value ('true' or 'false')");
      }
      return true;
    }),
];

import { body } from 'express-validator';

export default [
  body('isActive').custom((value) => {
    if (typeof value !== 'boolean') {
      throw new Error("active must be a boolean value ('true' or 'false')");
    }
    return true;
  }),
];

import { query } from 'express-validator';
import { Types } from 'mongoose';
export default [
  query('assignedTo')
    .optional() // Marks the field as optional
    .custom((value, { req }) => {
      if (value) {
        if (!Types.ObjectId.isValid(value)) {
          throw new Error(
            'Invalid assignedTo: must be a valid MongoDB ObjectId'
          );
        }
      }

      return true;
    }),
  query('client')
    .optional() // Marks the field as optional
    .custom((value, { req }) => {
      if (value) {
        if (!Types.ObjectId.isValid(value)) {
          throw new Error('Invalid client: must be a valid MongoDB ObjectId');
        }
      }
      return true;
    }),
  query('status')
    .optional()
    .isIn(['Pending', 'Ongoing', 'Completed'])
    .withMessage("status must be  'Pending'  'Ongoing' 'Completed' "),
];

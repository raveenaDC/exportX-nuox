import { query, body } from 'express-validator';
import { parse } from 'date-fns';

export default [
  query('action')
    .isIn(['approve', 'submitToClient', 'rework', 'reject', 'schedule'])
    .withMessage(
      "Invalid status. Should be one of: 'approve', 'submitToClient', 'rework', 'reject', 'schedule'"
    ),
  body('scheduleDate')
    .if(body('scheduleDate').exists()) // Corrected the syntax here
    .notEmpty()
    .withMessage('Schedule date is required')
    .custom((value, { req }) => {
      // Check if the value is a valid date
      const parsedDate = parse(value, 'dd-MM-yyyy', new Date());
      if (isNaN(parsedDate.getTime())) {
        throw new Error(
          'Schedule date must be a valid date in the format DD-MM-YYYY'
        );
      }
      return true;
    }),
];

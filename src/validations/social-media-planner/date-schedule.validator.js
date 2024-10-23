import { body } from 'express-validator';
import { parse } from 'date-fns';
export default [
  body('scheduleDate')
    .notEmpty()
    .withMessage('Schedule date is required')
    .custom((value, { req }) => {
      const parsedDate = parse(value, 'dd-MM-yyyy', new Date());
      if (isNaN(parsedDate.getTime())) {
        throw new Error(
          'Schedule date must be a valid date in the format DD-MM-YYYY'
        );
      }
      return true;
    }),
];

import { parse, isValid } from 'date-fns';
export const validateDate = (value) => {
  const dateRegex = /^\d{2}-\d{2}-\d{4}$/;

  if (!dateRegex.test(value))
    throw new Error('Invalid date format. Use dd-mm-yyyy');

  const parsedDate = parse(value, 'dd-MM-yyyy', new Date());
  if (!isValid(parsedDate)) throw new Error('Invalid date.');

  return true;
};

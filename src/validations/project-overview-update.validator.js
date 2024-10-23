import { body } from 'express-validator';
import { validateDate } from '../utils/validate-date.js';
const requiredFields = [
  'adGoals',
  'toneOfVoice',
  'callToAction',
  'targetAudience',
  'productServiceName',
  'briefDescription',
];
function hasRequiredFields(obj) {
  return requiredFields.every((field) => obj.hasOwnProperty(field));
}

export default [
  body('description').notEmpty().withMessage('description required'),
  body('startDate')
    .notEmpty()
    .withMessage('startDate required')
    .custom(validateDate),
  body('endDate')
    .notEmpty()
    .withMessage('endDate required')
    .custom(validateDate),
  body('projectBrief').custom((value) => {
    if (value && !hasRequiredFields(value)) {
      throw 'projectBrief must have ' + requiredFields.join(', ');
    }
    return true;
  }),
];

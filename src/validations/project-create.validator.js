import { body } from 'express-validator';
import { validateDate } from '../utils/validate-date.js';
const requiredFields = [
  'adGoal',
  'toneOfVoice',
  'targetAudience',
  'productServiceName',
  'description',
  'pillars',
  'observationDays',
];
const designBriefFields = [
  'background',
  'targetAudience',
  'deliverables',
  'toneOfVoice',
  'additionalInfo',
];

function hasRequiredFields(obj, fields) {
  return fields.every((field) => obj.hasOwnProperty(field));
}

export default [
  body('clientId').notEmpty().withMessage('clientId required'),
  body('name').notEmpty().withMessage('name required'),
  body('type').notEmpty().withMessage('type required'),
  body('ownerUserId').notEmpty().withMessage('ownerUserId required'),
  body('description').notEmpty().withMessage('description required'),
  body('startDate')
    .notEmpty()
    .withMessage('startDate required')
    .custom(validateDate),
  body('endDate')
    .notEmpty()
    .withMessage('endDate required')
    .custom(validateDate),
  body('coordinators')
    .isArray({ min: 1 })
    .withMessage('choose atleast one coordinator'),
  body('projectBrief').custom((value) => {
    if (value && !hasRequiredFields(value, requiredFields)) {
      throw 'projectBrief must have ' + requiredFields.join(', ');
    }
    return true;
  }),
  body('designBrief').custom((value) => {
    if (value && !hasRequiredFields(value, designBriefFields)) {
      throw 'designBrief must have ' + designBriefFields.join(', ');
    }
    return true;
  }),
];

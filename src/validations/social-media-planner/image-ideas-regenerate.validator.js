import { body } from 'express-validator';

export default [
  body('imageIdeas')
    .notEmpty()
    .withMessage('imageIdeas is required')
    .isArray({ min: 1 })
    .withMessage('please choose atleast one image idea'),
];

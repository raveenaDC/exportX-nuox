import { body } from 'express-validator';

export default [
  body('socialMediaPlatform')
    .notEmpty()
    .withMessage('socialMediaPlatform required')
    .isIn(['instagram', 'twitter', 'linkedin', 'facebook'])
    .withMessage(
      "socialMediaPlatform must be one of ['instagram', 'twitter', 'linkedin','facebook']"
    ),
  body('posts').notEmpty().withMessage('posts required'),
];

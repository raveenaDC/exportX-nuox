import { body } from 'express-validator';

export default [
  body('brandFont').notEmpty().withMessage('BrandFont required'),
  body('brandKitSubheadingCode')
    .notEmpty()
    .withMessage('BrandKit Subheading Code required'),
  body('targetAudience')
    .notEmpty()
    .withMessage('BrandKit Description Color Code required'),
  body('mainBrandColor').notEmpty().withMessage('Main BrandColor required'),
];

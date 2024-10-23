import { body } from 'express-validator';
import validator from 'validator';
const isHexColor = (value) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
const domainRegex = /^(?:https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

export default [
  body('firstName')
    .if(body('firstName').exists())
    .isLength({ min: 3, max: 30 })
    .withMessage('First name must be between 3 and 30 characters')
    .matches(/^[a-zA-Z\s.]+$/)
    .withMessage('First name is invalid')
    .trim()
    .escape(),

  body('lastName')
    .if(body('lastName').exists())
    .isLength({ min: 1, max: 30 })
    .withMessage('Last name must be between 1 and 30 characters')
    .matches(/^[a-zA-Z\s.]+$/)
    .withMessage('Last name is invalid')
    .trim()
    .escape(),

  body('brandColorCode')
    .if(body('brandColorCode').exists())
    .custom((value) => {
      if (!isHexColor(value)) {
        throw new Error('Invalid hexadecimal color code for brandColorCode');
      }
      return true;
    }),
  body('brandUrl')
    .if(body('brandUrl').exists())
    .custom((value) => {
      if (!validator.isURL(value, { require_protocol: true })) {
        throw new Error('Invalid URL format');
      }
      const { hostname, pathname, search } = new URL(value);

      // Check if the hostname is not empty and the pathname is '/'
      if (!hostname || pathname !== '/' || search !== '') {
        throw new Error(
          'URL should be in the format https://example.com or https://www.example.com'
        );
      }
      return true;
    }),

  body('subheadingColourCode')
    .if(body('subheadingColourCode').exists())
    .custom((value) => {
      if (!isHexColor(value)) {
        throw new Error(
          'Invalid hexadecimal color code for subheadingColorCode'
        );
      }
      return true;
    }),
  body('descriptionColorCode')
    .if(body('descriptionColorCode').exists())
    .custom((value) => {
      if (!isHexColor(value)) {
        throw new Error(
          'Invalid hexadecimal color code for descriptionColorCode'
        );
      }
      return true;
    }),
  body('mainBrandColor')
    .if(body('mainBrandColor').exists())
    .custom((value) => {
      if (!isHexColor(value)) {
        throw new Error('Invalid hexadecimal color code for mainBrandColor');
      }
      return true;
    }),
  body('brandKitSubheadingCode')
    .if(body('brandKitSubheadingCode').exists())
    .custom((value) => {
      if (!isHexColor(value)) {
        throw new Error(
          'Invalid hexadecimal color code for BrandKit SubheadingCode'
        );
      }
      return true;
    }),
  body('brandKitDescriptionColorCode')
    .if(body('brandKitDescriptionColorCode').exists())
    .custom((value) => {
      if (!isHexColor(value)) {
        throw new Error(
          'Invalid hexadecimal color code for BrandKit DescriptionColorCode '
        );
      }
      return true;
    }),
  // body('alternateColor')
  // .if(body('alternateColor').exists())
  // .custom((alternateColor) => {
  //     if (!Array.isArray(alternateColor)) {
  //         throw new Error('Alternate color must be an array');
  //     }
  //     for (let color of alternateColor) {
  //         if (!colorCodeRegex.test(color)) {
  //             throw new Error('Invalid hexadecimal color code');
  //         }
  //     }
  //     return true;
  // }),
  // body('brandInfo')
  //   .if(body('brandInfo').exists())
  //   .custom(async (value, { req }) => {
  //     let brandInfoArray;

  //     try {
  //       brandInfoArray = req.body.brandInfo;
  //     } catch (e) {
  //       throw new Error('Invalid JSON format for brandInfo');
  //     }

  //     for (const brandInfo of brandInfoArray) {
  //       if (brandInfo.logos && Array.isArray(brandInfo.logos)) {
  //         for (const logo of brandInfo.logos) {
  //           if (!mimeTypes.IMAGE.includes(logo.mimetype)) {
  //             await removeMulterFiles(req.files);
  //             throw new Error(`Only ${mimeTypes.IMAGE.join(',')} are accepted`);
  //           }
  //         }
  //       }
  //     }
  //     return true;
  //   }),
];

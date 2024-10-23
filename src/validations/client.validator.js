import { body } from 'express-validator';
const domainRegex = /^(?:https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const emailRegex = /^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,}$/;
const colorCodeRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const nameRegex = /^[a-zA-Z][a-zA-Z\s.]{3,30}$/;
import * as models from '../db/models/index.js';

const extractClientUsersAndClientSocialMedias = (body) => {
  const clientSocialMedias = [];
  const clientUsers = [];

  for (const key in body) {
    if (key.startsWith('clientSocialMedia')) {
      const index = key.match(/\[(.*?)\]/)[1];
      if (!clientSocialMedias[index]) clientSocialMedias[index] = {};
      const subKey = key.split('.').pop();
      clientSocialMedias[index][subKey] = body[key];
    } else if (key.startsWith('data')) {
      const index = key.match(/\[(.*?)\]/)[1];
      if (!clientUsers[index]) clientUsers[index] = {};
      const subKey = key.split('.').pop();
      if (subKey === 'view' || subKey === 'action') {
        // Convert 'true'/'false' strings to boolean
        clientUsers[index][subKey] = body[key] === 'true';
      } else {
        clientUsers[index][subKey] = body[key];
      }
    }
  }
  return { clientSocialMedias, clientUsers };
};

export default [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('First name must be between 3 and 30 characters')
    .matches(/^[a-zA-Z\s.]+$/)
    .withMessage('First name is invalid')
    .trim()
    .escape(),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 30 })
    .withMessage('Last name must be between 1 and 30 characters')
    .matches(/^[a-zA-Z\s.]+$/)
    .withMessage('Last name is invalid')
    .trim()
    .escape(),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .matches(/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,}$/)
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .trim()
    .escape(),
  body('primaryContactNo')
    .notEmpty()
    .withMessage('primaryContactNo is required'),
  body('primaryIsdCode').notEmpty().withMessage('primaryIsdCode is required'),
  body('country').notEmpty().withMessage('country is required'),
  body('brandUrl')
    .notEmpty()
    .withMessage('brand url is required')
    .if(body('brandUrl').exists())
    .custom((url) => {
      if (!domainRegex.test(url)) {
        throw new Error(
          'brandUrl should be in the format https://example.com or https://www.example.com'
        );
      }
      return true;
    }),
  body('brandColorCode')
    .if(body('brandColorCode').exists())
    .custom((brandColorCode) => {
      if (!colorCodeRegex.test(brandColorCode)) {
        throw new Error('Invalid hexadecimal color code');
      }
      return true;
    }),
  body('subheadingColourCode')
    .if(body('subheadingColourCode').exists())
    .custom((subheadingColourCode) => {
      if (!colorCodeRegex.test(subheadingColourCode)) {
        throw new Error('Invalid hexadecimal color code');
      }
      return true;
    }),
  body('descriptionColorCode')
    .if(body('descriptionColorCode').exists())
    .custom((descriptionColorCode) => {
      if (!colorCodeRegex.test(descriptionColorCode)) {
        throw new Error('Invalid hexadecimal color code');
      }
      return true;
    }),
  body('mainBrandColor')
    .if(body('mainBrandColor').exists())
    .custom((mainBrandColor) => {
      if (!colorCodeRegex.test(mainBrandColor)) {
        throw new Error('Invalid hexadecimal color code');
      }
      return true;
    }),
  body('brandKitSubheadingCode')
    .if(body('brandKitSubheadingCode').exists())
    .custom((brandKitSubheadingCode) => {
      if (!colorCodeRegex.test(brandKitSubheadingCode)) {
        throw new Error('Invalid hexadecimal color code');
      }
      return true;
    }),
  body('brandKitDescriptionColorCode')
    .if(body('brandKitDescriptionColorCode').exists())
    .custom((brandKitDescriptionColorCode) => {
      if (!colorCodeRegex.test(brandKitDescriptionColorCode)) {
        throw new Error('Invalid hexadecimal color code');
      }
      return true;
    }),
  // body('alternateColor')
  //   .if(body('alternateColor').exists())
  //   .custom((alternateColor) => {
  //     if (!colorCodeRegex.test(alternateColor)) {
  //       throw new Error('Invalid hexadecimal color code');
  //     }
  //     return true;
  //   }),
  body('data').custom(async (value, { req }) => {
    if (
      req.body['data[0].clientUserName'] ||
      req.body['data[0].clientUseremail']
    ) {
      const clientEmail = req.body['email'];
      const { clientUsers } = extractClientUsersAndClientSocialMedias(req.body);

      for (let clientUser of clientUsers) {
        if (!clientUser.clientUserName || !clientUser.clientUserEmail) {
          throw new Error('each client-user must have username and email');
        }

        if (!nameRegex.test(clientUser.clientUserName)) {
          throw new Error(
            `Invalid name format (${clientUser.clientUserName}). The field must be between 3 and 30 characters and can only contain letters, spaces.`
          );
        }

        if (!emailRegex.test(clientUser.clientUserEmail)) {
          throw new Error(
            `Invalid email address (${clientUser.clientUserEmail}).`
          );
        }

        if (clientUser.clientUserEmail === clientEmail) {
          throw new Error('client and client-user email can not be the same');
        }
      }
      for (let clientUser of clientUsers) {
        let existEmail = await models.clientUserModel.findOne({
          clientUserEmail: clientUser.clientUserEmail,
        });

        if (existEmail) {
          throw new Error(
            `This client user email already exists (${clientUser.clientUserEmail}).`
          );
        }
      }
    }
    return true;
  }),

  body('clientSocialMedia').custom((value, { req }) => {
    if (req.body['clientSocialMedia[0].media']) {
      const { clientSocialMedias } = extractClientUsersAndClientSocialMedias(
        req.body
      );
      for (let clientSocialMedia of clientSocialMedias) {
        if (!clientSocialMedia.mediaToken || !clientSocialMedia.media) {
          throw new Error(
            'each client-socialmedia account must have mediaToken and media'
          );
        }
      }
    }
    return true;
  }),
];

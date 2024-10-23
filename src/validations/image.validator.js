import { body } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
import { mimeTypes } from '../registry/mimetype.registry.js';
export default [
  body('clientImage').custom(async (value, { req }) => {
    if (
      req.files.clientImage &&
      !mimeTypes.IMAGE.includes(req.files.clientImage[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
  body('logoImage').custom(async (value, { req }) => {
    if (
      req.files.logoImage &&
      !mimeTypes.IMAGE.includes(req.files.logoImage[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
  body('waterMarkImage').custom(async (value, { req }) => {
    if (
      req.files.waterMarkImage &&
      !mimeTypes.IMAGE.includes(req.files.waterMarkImage[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
  body('brandKitLogo').custom(async (value, { req }) => {
    if (
      req.files.brandKitLogo &&
      !mimeTypes.IMAGE.includes(req.files.brandKitLogo[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
  body('brandPattern').custom(async (value, { req }) => {
    if (
      req.files.brandPattern &&
      !mimeTypes.IMAGE.includes(req.files.brandPattern[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
  body('template').custom(async (value, { req }) => {
    if (
      req.files.template &&
      !mimeTypes.IMAGE.includes(req.files.template[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
  body('brandInfo')
  .if(body('brandInfo').exists())
  .custom(async (value, { req }) => {
      let brandInfoArray;
  
        brandInfoArray = req.body.brandInfo;
      
  
      for (const brandInfo of brandInfoArray) {
        if (brandInfo.logos && Array.isArray(brandInfo.logos)) {
          for (const logo of brandInfo.logos) {
            if (!mimeTypes.IMAGE.includes(logo.mimetype)) {
              await removeMulterFiles(req.files);
              throw new Error(`Only ${mimeTypes.IMAGE.join(',')} are accepted`);
            }
          }
        }
      }
      return true;
    }),
];

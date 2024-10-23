import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
import { validationResult } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
/**
 * middleware to validate request based on the schema.
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction } next
 */
export default async function validationCheckMiddleWare(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const errorMap = {};
    errorArray.forEach((error) => {
      const { path, value, msg } = error;

      if (!errorMap[path]) {
        errorMap[path] = {
          value: value || null,
          error: msg,
        };
      }
    });
    //remove multer files
    if (errorMap && req.files) {
      await removeMulterFiles(req.files);
    }

    return responseHelper(
      res,
      httpStatus.UNPROCESSABLE_ENTITY,
      true,
      'Validation errors',
      errorMap
    );
  } else {
    next();
  }
}

export { validationCheckMiddleWare };

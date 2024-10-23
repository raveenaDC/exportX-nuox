// Update the multerStorage function to use diskStorage
import multer from 'multer';
import path from 'path';
import * as uuid from 'uuid';
import { getCurrentWorkingFolder } from '../utils/get-current-working-folder.helper.js';

export const multerStorage = (destinationPath = '') => {
  const dirname = path.join(
    getCurrentWorkingFolder(import.meta.url),
    '../../public/uploads',
    destinationPath
  );
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(dirname));
    },
    filename: function (req, file, cb) {
      const fileExtension = path.extname(file.originalname);
      const uniqueFileName = uuid.v4() + fileExtension;
      cb(null, uniqueFileName);
    },
  });
};

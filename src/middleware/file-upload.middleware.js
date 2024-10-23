import multer from 'multer';
import fs from 'fs';
import { multerStorage } from '../config/multer.config.js';
import { fileSize, videoSize } from '../config/file-size.config.js';
/**
 * upload handler
 * @param {string} destinationPath
 */
export default function fileUploadMiddleWare(destinationPath = '', type) {
  // Create the destination folder if it doesn't exist
  let destinationPaths = './public/uploads/' + destinationPath;
  if (!fs.existsSync(destinationPaths)) {
    fs.mkdirSync(destinationPaths, { recursive: true });
  }
  return multer({
    storage: multerStorage(destinationPath),
    limits: {
      fileSize: type ? videoSize : fileSize,
    },
  }).any();
}

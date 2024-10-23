import { unlinkSync } from 'fs';
/**
 * remove every  multer uploaded files
 * @param {Object}
 */
export const removeMulterFiles = async (files = {}) => {
  if (!files) throw new Error('files are required');
  try {
    for (const key in files) {
      for (const file of files[key]) {
        await unlinkSync(file.path);
      }
    }
  } catch (error) {
    console.log('error removing files : ', error);
  }
};

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function downloadAndSaveImage(url, localPath) {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
    });

    const extension = path.extname(url);
    const uniqueIdentifier = uuidv4();
    const fileName = `${uniqueIdentifier}.png`;
    const filePath = path.join(localPath, fileName);

    response.data.pipe(fs.createWriteStream(filePath));

    return new Promise((resolve, reject) => {
      response.data.on('end', () => resolve({ filePath, fileName }));
      response.data.on('error', (error) => reject(error));
    });
  } catch (error) {
    throw new Error(`Error downloading image: ${error.message}`);
  }
}

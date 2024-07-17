import archiver from 'archiver';
import { deleteLocalFiles } from '../util/util.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

async function createZipFromImages(imagePaths) {
  return new Promise((resolve, reject) => {
    const zipFilename = `/tmp/filtered_images_${uuidv4()}.zip`;
    const output = fs.createWriteStream(zipFilename);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', () => resolve(zipFilename));
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    imagePaths.forEach((filePath) => {
      archive.file(filePath, { name: filePath.split('/').pop() });
    });

    archive.finalize();
  });
}

export async function sendFilesAsResponse(res, files) {
  if (files.length === 1) {
    res.sendFile(files[0], {}, async (err) => {
      if (err) {
        console.error('Error sending file:', err.message);
        res.status(500).send({ message: 'Error processing image' });
      } else {
        await deleteLocalFiles(files);
      }
    });
  } else {
    try {
      const zipFilename = await createZipFromImages(files);
      res.sendFile(zipFilename, {}, async (err) => {
        if (err) {
          console.error('Error sending file:', err.message);
          res.status(500).send({ message: 'Error processing images' });
        } else {
          await deleteLocalFiles([...files, zipFilename]);
        }
      });
    } catch (error) {
      console.error('Error creating ZIP file:', error.message);
      res.status(500).send({ message: 'Error processing images' });
    }
  }
}

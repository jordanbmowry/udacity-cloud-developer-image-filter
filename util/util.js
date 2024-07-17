import fs from 'fs';
import Jimp from 'jimp';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import archiver from 'archiver';

// filterImageFromURL
// helper function to download, filter, and save the filtered image locally
// returns the absolute path to the local image
// INPUTS
//    inputURL: string - a publicly accessible url to an image file
// RETURNS
//    an absolute path to a filtered image locally saved file
export async function filterImageFromURL(inputURL) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(inputURL, {
        responseType: 'arraybuffer',
      });
      const photo = await Jimp.read(response.data);
      const outpath = `/tmp/filtered.${uuidv4()}.jpg`;
      await photo
        .resize(256, 256) // resize
        .quality(60) // set JPEG quality
        .greyscale() // set greyscale
        .write(outpath, (img) => {
          resolve(outpath);
        });
    } catch (error) {
      reject(error);
    }
  });
}

// deleteLocalFiles
// helper function to delete files on the local disk
// useful to cleanup after tasks
// INPUTS
//    files: Array<string> an array of absolute paths to files
export async function deleteLocalFiles(files) {
  for (let file of files) {
    fs.unlinkSync(file);
  }
}

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

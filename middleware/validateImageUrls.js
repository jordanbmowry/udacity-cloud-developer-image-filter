import { URL } from 'url';
import validUrl from 'valid-url';
import axios from 'axios';

export async function validateImageUrls(req, res, next) {
  const imageUrls = req.query.image_url?.split(',');

  if (!imageUrls || imageUrls.length === 0) {
    return next({
      status: 400,
      message: 'image_url query parameter is required',
    });
  }

  for (const imageUrl of imageUrls) {
    if (!validUrl.isUri(imageUrl)) {
      return res.status(400).send({ message: `Invalid URL: ${imageUrl}` });
    }

    const validExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.webp',
      '.svg',
    ];
    const urlExtension = new URL(imageUrl).pathname
      .split('.')
      .pop()
      .toLowerCase();

    if (!validExtensions.includes(`.${urlExtension}`)) {
      return next({
        status: 400,
        message: `URL does not point to a valid image format: ${imageUrl}`,
      });
    }
  }

  const urlChecks = imageUrls.map(async (imageUrl) => {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
      });
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`URL does not point to an image: ${imageUrl}`);
      }
    } catch (error) {
      throw new Error(`Unable to fetch the URL: ${imageUrl}`);
    }
  });

  try {
    await Promise.all(urlChecks);
    next();
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
}

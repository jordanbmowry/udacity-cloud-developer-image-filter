import express from 'express';
import bodyParser from 'body-parser';
import { validateImageUrls } from './middleware/validateImageUrls.js';
// import { sendFilesAsResponse } from './middleware/sendFilesAsResponse.js';
import { filterImageFromURL, sendFilesAsResponse } from './util/util.js';
import * as dotenv from 'dotenv';

dotenv.config();

// Init the Express application
const app = express();

// Set the network port
const port = process.env.PORT || 8080;

// Use the body parser middleware for post requests
app.use(bodyParser.json());

// @TODO1 IMPLEMENT A RESTFUL ENDPOINT
// GET /filteredimage?image_url={{URL}}
// endpoint to filter an image from a public url.
// IT SHOULD
//    1
//    1. validate the image_url query
//    2. call filterImageFromURL(image_url) to filter the image
//    3. send the resulting file in the response
//    4. deletes any files on the server on finish of the response
// QUERY PARAMATERS
//    image_url: URL of a publicly accessible image
// RETURNS
//   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

/**************************************************************************** */
app.get('/filteredimage', validateImageUrls, async (req, res, next) => {
  const imageUrls = req.query.image_url.split(',');
  try {
    const filteredImagePaths = await Promise.all(
      imageUrls.map(filterImageFromURL)
    );
    await sendFilesAsResponse(res, filteredImagePaths);
  } catch (error) {
    console.error('Error filtering images:', error.message);
    next({ status: 500, message: 'Error processing images' });
  }
});
//! END @TODO1

// Root Endpoint
// Displays a simple message to the user
app.get('/', async (req, res) => {
  res.send('try GET /filteredimage?image_url={{}}');
});

app.use((error, req, res, next) => {
  const { status = 500, message = 'Something went wrong!' } = error;
  res.status(status).json({ error: message });
});

// Start the Server
app.listen(port, () => {
  console.log(`server running http://localhost:${port}`);
  console.log(`press CTRL+C to stop server`);
});

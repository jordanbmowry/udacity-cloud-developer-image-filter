import express from 'express';
import bodyParser from 'body-parser';
import { validateImageUrls } from './middleware/validateImageUrls.js';
import { filterImageFromURL, sendFilesAsResponse } from './util/util.js';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize the Express application
const app = express();

// Set the network port
const { PORT, EB_URL } = process.env;
const port = PORT || 8080;
const domain = EB_URL || 'http://localhost:';

// Use the body parser middleware for post requests
app.use(bodyParser.json());

// Endpoint to filter an image from a public URL
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

// Root Endpoint
// Displays a simple message to the user
app.get('/', async (req, res) => {
  res.send('try GET /filteredimage?image_url={{URL}}');
});

// Error handling middleware
app.use((error, req, res, next) => {
  const { status = 500, message = 'Something went wrong!' } = error;
  res.status(status).json({ error: message });
});

// Start the Server
app.listen(port, () => {
  console.log(`server running ${domain}${port}`);
  console.log(`press CTRL+C to stop server`);
});

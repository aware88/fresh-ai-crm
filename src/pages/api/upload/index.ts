import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Disable the default body parser to allow formidable to parse the request
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Parse the incoming form data
    const form = new IncomingForm({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    return new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Error parsing form:', err);
          res.status(500).json({ error: 'Error uploading file' });
          return resolve(undefined);
        }

        try {
          // Get the uploaded file
          const file = files.file?.[0];
          if (!file) {
            res.status(400).json({ error: 'No file uploaded' });
            return resolve(undefined);
          }

          // Generate a unique filename
          const uniqueFilename = `${uuidv4()}${path.extname(file.originalFilename || '')}`;
          const finalPath = path.join(uploadsDir, uniqueFilename);

          // Move the file to its final location
          fs.renameSync(file.filepath, finalPath);

          // Return the file path for use in the dispute resolver
          res.status(200).json({ 
            success: true, 
            filePath: finalPath,
            filename: file.originalFilename,
            size: file.size 
          });
          
          return resolve(undefined);
        } catch (error) {
          console.error('Error handling file:', error);
          res.status(500).json({ error: 'Error processing file' });
          return resolve(undefined);
        }
      });
    });
  } catch (error) {
    console.error('Error in upload handler:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

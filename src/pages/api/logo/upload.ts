import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File, Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';

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
    // Create logos directory if it doesn't exist
    const logosDir = path.join(process.cwd(), 'public', 'logos');
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }

    // Parse the incoming form data
    const form = new IncomingForm({
      uploadDir: logosDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      filter: (part: any) => {
        // Only accept image files
        return part.mimetype?.includes('image') || false;
      },
    });

    return new Promise((resolve, reject) => {
      form.parse(req, async (err: any, fields: Fields, files: Files) => {
        if (err) {
          console.error('Error parsing form:', err);
          res.status(500).json({ error: 'Error uploading logo' });
          return resolve(undefined);
        }

        try {
          // Get the uploaded file
          const file = files.logo?.[0];
          if (!file) {
            res.status(400).json({ error: 'No logo uploaded' });
            return resolve(undefined);
          }

          // Validate file type
          const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
          if (!validTypes.includes(file.mimetype || '')) {
            res.status(400).json({ error: 'Invalid file type. Only PNG, JPEG, and SVG are allowed.' });
            // Remove the invalid file
            fs.unlinkSync(file.filepath);
            return resolve(undefined);
          }

          // Use a fixed filename for the company logo
          const logoFilename = 'company-logo' + path.extname(file.originalFilename || '.png');
          const finalPath = path.join(logosDir, logoFilename);

          // Remove old logo if it exists
          if (fs.existsSync(finalPath)) {
            fs.unlinkSync(finalPath);
          }

          // Move the file to its final location
          fs.renameSync(file.filepath, finalPath);

          // Save logo path to a config file
          const configPath = path.join(process.cwd(), 'src', 'data', 'config.json');
          let config = { logoPath: `/logos/${logoFilename}` };
          
          if (fs.existsSync(configPath)) {
            try {
              const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              config = { ...existingConfig, logoPath: `/logos/${logoFilename}` };
            } catch (e) {
              console.error('Error reading config file:', e);
            }
          }
          
          // Create data directory if it doesn't exist
          const dataDir = path.join(process.cwd(), 'src', 'data');
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
          }
          
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

          // Return the logo path
          res.status(200).json({ 
            success: true, 
            logoPath: `/logos/${logoFilename}`
          });
          
          return resolve(undefined);
        } catch (error) {
          console.error('Error handling logo:', error);
          res.status(500).json({ error: 'Error processing logo' });
          return resolve(undefined);
        }
      });
    });
  } catch (error) {
    console.error('Error in logo upload handler:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

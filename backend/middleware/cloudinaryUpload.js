const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

/**
 * Middleware to upload files from disk to Cloudinary
 * Reads files stored by multer and uploads them to Cloudinary
 * Removes local files after successful upload
 */
const cloudinaryUpload = async (req, res, next) => {
  try {
    // Handle multer.fields() format: req.files = { fieldname: [...files] }
    console.log('[CLOUDINARY] Middleware triggered');
    console.log('[CLOUDINARY] req.files keys:', Object.keys(req.files || {}));
    
    const mediaFiles = req.files?.media || [];
    
    console.log(`[CLOUDINARY] Found ${mediaFiles.length} media files to upload`);
    
    if (!mediaFiles || mediaFiles.length === 0) {
      console.log('[CLOUDINARY] No media files, skipping upload');
      return next();
    }

    console.log(`[CLOUDINARY] Starting upload of ${mediaFiles.length} files`);
    const mediaUrls = [];

    for (const file of mediaFiles) {
      try {
        console.log(`[CLOUDINARY] Processing file: ${file.filename}`);
        console.log(`[CLOUDINARY] File path: ${file.path}`);
        console.log(`[CLOUDINARY] File size: ${file.size} bytes`);
        
        // Check if file exists on disk
        const fileExists = fs.existsSync(file.path);
        console.log(`[CLOUDINARY] File exists on disk: ${fileExists}`);
        
        if (!fileExists) {
          throw new Error(`File not found at path: ${file.path}`);
        }

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: 'grungy/actions',
              timeout: 60000,
            },
            (error, result) => {
              if (error) {
                console.error(`[CLOUDINARY] Upload error for ${file.filename}:`, error.message);
                reject(error);
              } else {
                console.log(`[CLOUDINARY] ✓ Uploaded: ${result.secure_url}`);
                resolve(result);
              }
            }
          );

          uploadStream.on('error', (err) => {
            console.error(`[CLOUDINARY] Stream error for ${file.filename}:`, err.message);
            reject(err);
          });
          
          uploadStream.on('close', () => {
            console.log(`[CLOUDINARY] Stream closed for ${file.filename}`);
          });

          // Read file from disk and pipe to Cloudinary
          const readStream = fs.createReadStream(file.path);
          
          readStream.on('error', (err) => {
            console.error(`[CLOUDINARY] Read stream error for ${file.filename}:`, err.message);
            reject(err);
          });
          
          readStream.on('open', () => {
            console.log(`[CLOUDINARY] Read stream opened for ${file.filename}`);
          });
          
          readStream.pipe(uploadStream);
        });

        mediaUrls.push(result.secure_url);

        // Delete local file after successful upload
        fs.unlink(file.path, (err) => {
          if (err) console.error(`[CLEANUP] Failed to delete ${file.path}:`, err.message);
          else console.log(`[CLEANUP] ✓ Deleted local file: ${file.filename}`);
        });
      } catch (uploadError) {
        console.error(`[CLOUDINARY] Error uploading file ${file.filename}:`, uploadError.message);
        throw uploadError;
      }
    }

    // Attach media URLs to request for use in controller
    req.mediaUrls = mediaUrls;
    console.log(`[CLOUDINARY] ✓ All files uploaded. Total URLs: ${mediaUrls.length}`);
    next();
  } catch (error) {
    console.error('[CLOUDINARY] Fatal error:', error.message);

    // Clean up any uploaded files on error
    const mediaFiles = req.files?.media || [];
    if (mediaFiles.length > 0) {
      mediaFiles.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (!err) console.log(`[CLEANUP] Deleted after error: ${file.filename}`);
        });
      });
    }

    res.status(500).json({
      message: 'Error uploading media files to Cloudinary',
      error: error.message,
    });
  }
};

module.exports = cloudinaryUpload;

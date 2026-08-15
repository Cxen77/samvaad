import asyncHandler from 'express-async-handler';
import cloudinary from '../config/cloudinary.js';
import stream from 'stream';

// @desc    Upload an image to Cloudinary
// @route   POST /api/upload
// @access  Private (or Public depending on requirements)
const uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No image file provided');
    }

    const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: 'synapse_uploads', // Optional: organize uploads in a folder
        },
        (error, result) => {
            if (error) {
                console.error('Cloudinary Upload Error:', error);
                res.status(500).json({ message: 'Image upload failed' });
            } else {
                res.json({
                    message: 'Image uploaded successfully',
                    imageUrl: result.secure_url,
                    publicId: result.public_id
                });
            }
        }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    bufferStream.pipe(uploadStream);
});

export { uploadImage };

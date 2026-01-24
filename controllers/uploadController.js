// Upload single image
export const uploadImage = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded',
        });
    }

    // req.file.path will contain the secure Cloudinary URL
    const imageUrl = req.file.path;

    res.json({
        success: true,
        data: {
            url: imageUrl,
            filename: req.file.filename,
        },
    });
};

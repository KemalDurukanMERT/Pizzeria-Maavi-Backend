
// Upload single image
export const uploadImage = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded',
        });
    }

    // Return the URL relative to server root
    // Client will prepend API_URL or directly access server static path
    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
        success: true,
        data: {
            url: imageUrl,
            filename: req.file.filename,
        },
    });
};

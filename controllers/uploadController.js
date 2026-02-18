export const uploadImage = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded',
        });
    }

    const imageUrl = req.file.path;

    res.json({
        success: true,
        data: {
            url: imageUrl,
            filename: req.file.filename,
        },
    });
};

const multer = require('multer');
const { GeminiVinService } = require('../services/geminiVin.service');
const { guessMimeType } = require('../utils/vin.utils');
const { VinResult } = require('../models/vin.model');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

const geminiVinService = new GeminiVinService(process.env.GEMINI_API_KEY);

const vinUploadMiddleware = upload.single('image');

async function extractVinController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json(
        new VinResult({
          ok: false,
          message: 'image file is required',
        }),
      );
    }

    const mimeType = req.file.mimetype || guessMimeType(req.file.originalname);

    const result = await geminiVinService.extractVinFromBuffer({
      buffer: req.file.buffer,
      mimeType,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('VIN extraction error:', error);

    return res.status(500).json(
      new VinResult({
        ok: false,
        message: error?.message || 'Internal server error',
      }),
    );
  }
}

module.exports = {
  vinUploadMiddleware,
  extractVinController,
};

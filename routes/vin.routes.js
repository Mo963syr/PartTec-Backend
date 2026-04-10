const express = require('express');
const {
  extractVinController,
  vinUploadMiddleware,
} = require('../controllers/vin.controller');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true });
});

router.post('/extract', vinUploadMiddleware, extractVinController);

module.exports = router;
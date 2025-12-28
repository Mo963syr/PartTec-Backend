// routes/carBrands.js
const express = require('express');
const router = express.Router();
const CarBrand = require('../models/CarBrand');

// جلب كل الشركات مع موديلاتها
router.get('/brands', async (req, res) => {
  const brands = await CarBrand.find();
  res.json(brands);
});

// جلب موديلات شركة معينة حسب الكود
router.get('/brands/:code/models', async (req, res) => {
  const brand = await CarBrand.findOne({ code: req.params.code });
  if (!brand) return res.status(404).json({ error: 'Brand not found' });
  res.json(brand.models);
});

module.exports = router;
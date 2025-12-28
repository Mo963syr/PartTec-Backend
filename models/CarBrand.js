// models/CarBrand.js
const mongoose = require('mongoose');

const carBrandSchema = new mongoose.Schema({
  name: { type: String, required: true },   // الاسم بالعربي
  code: { type: String, required: true },   // الكود بالإنجليزي
  models: [{ type: String }]                // قائمة الموديلات
});

module.exports = mongoose.model('CarBrand', carBrandSchema);
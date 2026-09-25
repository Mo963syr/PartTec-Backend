const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'يجب إدخال اسم المستودع'],
      trim: true,
      unique: true,
      maxlength: [100, 'اسم المستودع لا يمكن أن يتجاوز 100 حرف'],
    },

    address: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports =
  mongoose.models.Warehouse || mongoose.model('Warehouse', warehouseSchema);

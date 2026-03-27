const mongoose = require('mongoose');
const {
  normalizeManufacturer,
  normalizeModel,
} = require('../utils/normalization');

const carSchema = new mongoose.Schema(
  {
    manufacturer: {
      type: String,
      required: [true, ' يجب إدخال اسم الصانع'],
    },
    manufacturerNormalized: {
      type: String,
      index: true,
    },

    model: {
      type: String,
      required: [true, ' يجب إدخال اسم الطراز أو السلسلة'],
    },
    modelNormalized: {
      type: String,
      index: true,
    },

    year: {
      type: Number,
      required: [true, ' يجب إدخال سنة الصنع'],
    },
    serialNumber: {
      type: String,
      unique: [true, ' يجب أن يكون رقم الشاص فريدًا'],
      required: [true, ' يجب إدخال رقم الشاص'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'يجب ربط السيارة بمعرف المستخدم'],
    },
  },
  {
    timestamps: true,
  }
);

carSchema.index({ manufacturerNormalized: 1, modelNormalized: 1 });
carSchema.index({ user: 1 });

carSchema.pre('save', function (next) {
  this.manufacturerNormalized = normalizeManufacturer(this.manufacturer);
  this.modelNormalized = normalizeModel(this.model);
  next();
});

function setNormalizedFields(update) {
  if (!update) return;

  const manufacturer = update.manufacturer || update.$set?.manufacturer;
  const model = update.model || update.$set?.model;

  if (!update.$set) update.$set = {};

  if (manufacturer) {
    update.$set.manufacturerNormalized = normalizeManufacturer(manufacturer);
  }

  if (model) {
    update.$set.modelNormalized = normalizeModel(model);
  }
}

carSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  setNormalizedFields(update);
  next();
});

carSchema.pre('updateOne', function (next) {
  const update = this.getUpdate();
  setNormalizedFields(update);
  next();
});

module.exports = mongoose.models.Car || mongoose.model('Car', carSchema);
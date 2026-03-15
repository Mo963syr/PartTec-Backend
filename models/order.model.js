// models/Order.js
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cartIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart',
        required: true,
      },
    ],
    summaryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderSummary',
      },
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function (val) {
            return Array.isArray(val) && val.length === 2;
          },
          message: 'يجب تحديد إحداثيات صحيحة [lng, lat]',
        },
        required: false,
      },
    },
    status: {
      type: String,
      enum: [
        'قيد التجهيز',
        'مؤكد',
        'مستلمة',
        'على الطريق',
        'تم التوصيل',
        'ملغي',
        'موافق عليها',
      ],
      default: 'مؤكد',
    },

    delivery: {
      driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      fee: { type: Number, default: null },
      acceptedAt: { type: Date },
      startedAt: { type: Date },
      deliveredAt: { type: Date },
      canceledAt: { type: Date },
      canceledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      cancelReason: { type: String, default: '' },

      province: { type: String, default: '' },
      provinceNorm: { type: String, default: '' },
    },

    payment: {
      paymentId: { type: String },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'canceled'],
        default: 'pending',
      },
    },
  },
  {
    timestamps: {
      currentTime: () => new Date(Date.now() + 3 * 60 * 60 * 1000),
    },
  },
);

orderSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);

// models/DeletedUser.js
const mongoose = require('mongoose');

const deletedUserSchema = new mongoose.Schema(
  {
    originalUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    name: String,
    companyName: String,

    email: {
      type: String,
      lowercase: true,
    },

    password: String,

    phoneNumber: String,

    createdAt: Date,

    cars: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
      },
    ],

    prands: {
      type: [String],
      default: [],
    },

    role: {
      type: String,
      enum: ['user', 'seller', 'worker', 'delivery', 'mechanic'],
    },

    province: String,

    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },

    provinceNorm: String,

    deletedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DeletedUser ||
  mongoose.model('DeletedUser', deletedUserSchema);
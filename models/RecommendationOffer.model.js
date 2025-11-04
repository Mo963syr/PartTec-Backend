const mongoose = require('mongoose');

const recommendationOfferSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'spicificorderschema',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    imageUrl: [
      {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(
              v
            );
          },
          message: (props) => `${props.value} ليس رابط صحيح للصورة!`,
        },
      },
    ],
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['متاح', 'غير متاح', 'قيد المراجعة'],
      default: 'متاح',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'RecommendationOffer',
  recommendationOfferSchema
);

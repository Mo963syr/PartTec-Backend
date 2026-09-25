const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const router = express.Router();

const specificOrderImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const directory = path.join(
        process.cwd(),
        'uploads',
        'specific-orders',
      );
      fs.mkdirSync(directory, { recursive: true });
      cb(null, directory);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      cb(
        null,
        `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`,
      );
    },
  }),
});
const {
  addOrder,
  vieworderitem,
  getOrdersForSeller,
  updateOrderStatus,
  viewspicificorderitem,
  getUserBrandOrders,
  viewspicificordercompleted,
  getOrdersWithAverageRatings,
  getOrderStatus,
  updateOrderStatuss,
  deleteorder,
  deleteSpicificOrder,
} = require('../controllers/order.controller');

const { addspicificorder } = require('../controllers/part.Controller');
const {
  getOrderSummariesByUser,
} = require('../controllers/orderSummary.Controller');
// const { createOffer ,getOffersByOrder } = require('../controllers/recommendationOffer.Controller');
router.post(
  '/addspicificorder',
  specificOrderImageUpload.single('image'),
  addspicificorder,
);
router.post('/create', addOrder);
router.get('/viewuserorder/:userId', vieworderitem);
router.get('/viewuserspicificorder/:userId', viewspicificorderitem);
router.get('/getUserBrandOrders/:userId', getUserBrandOrders);
router.get('/getOrderForSellrer/:sellerId', getOrdersForSeller);
router.put('/updateOrderStatus/:orderId', updateOrderStatus);
router.get('/order-summary/:userId', getOrderSummariesByUser);
router.get('/viewspicificordercompleted/:userId', viewspicificordercompleted);
router.get('/getOrdersWithAverageRatings', getOrdersWithAverageRatings);
router.get('/:id/status', getOrderStatus);
router.put('/:id/status', updateOrderStatuss);
router.delete('/deleteorder/:orderId', deleteorder);
router.delete('/deleteSpicificOrder/:orderId', deleteSpicificOrder);
module.exports = router;

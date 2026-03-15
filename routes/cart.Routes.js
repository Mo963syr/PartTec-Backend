const express = require('express');
const router = express.Router();

const {
  addPart,
  viewcartitem,
  getCartItemsForSeller,
  updateCartStatus,
  deleteCartItem
} = require('../controllers/cart.Controller');

router.post('/addToCart', addPart);
router.get('/viewcartitem/:userId', viewcartitem);
router.get('/getCartItemsForSeller/:sellerId', getCartItemsForSeller);
router.put('/status/:cartId', updateCartStatus);
router.delete('/deleteCartItem/:cartId', deleteCartItem);
module.exports = router;

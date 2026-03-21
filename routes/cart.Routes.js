const express = require('express');
const router = express.Router();

const {
  addPart,
  viewcartitem,
  getCartItemsForSeller,
  updateCartItem,
  deleteCartItem,
} = require('../controllers/cart.Controller');

router.post('/addToCart', addPart);
router.get('/viewcartitem/:userId', viewcartitem);
router.get('/getCartItemsForSeller/:sellerId', getCartItemsForSeller);
router.patch('/updateCartItem/:cartId', updateCartItem);
router.delete('/deleteCartItem/:cartId', deleteCartItem);
module.exports = router;

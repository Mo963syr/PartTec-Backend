const express = require('express');
const router = express.Router();

const {
  addPart,
  viewcartitem,
  getCartItemsForSeller,
  updateCartItem,
  deleteCartItem,
  getCartItemStock
} = require('../controllers/cart.Controller');

router.post('/addToCart', addPart);
router.get('/viewcartitem/:userId', viewcartitem);
router.get('/getCartItemsForSeller/:sellerId', getCartItemsForSeller);
router.patch('/updateCartItem/:cartId', updateCartItem);
  router.get('/getCartItemStock/:cartId', getCartItemStock);
router.delete('/deleteCartItem/:cartId', deleteCartItem);
module.exports = router;

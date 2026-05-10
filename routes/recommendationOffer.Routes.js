const express = require('express');
const upload = require('../middleware/upload');
const router = express.Router();
const {
  createOffer,
  getOffersByOrder,
  applyOfferToOrder,
} = require('../controllers/recommendationOffer.Controller');


router.post('/recommendation-offer', upload.single('image'), createOffer);
router.get(
  '/recommendation-offer/:orderId',
  /*authMiddleware,*/ getOffersByOrder
);

router.post('/apply-offer', /*authMiddleware,*/ applyOfferToOrder);

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const {
  deletePart,
  getallOrdersForSeller,
  CompatibleSpicificOrders,
  updatePart,
  addPart,
  getCompatibleParts,
  viewAllParts,
  viewsellerParts,
  ratePart,
  getPartRatings,
  addPartsFromExcel,
  getAllParts,
  getPartsbyId,
  getRecommendations,
} = require('../controllers/part.Controller');

const upload = multer({ dest: 'uploads/' });
const partImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const directory = path.join(process.cwd(), 'uploads', 'parts');
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

router.post('/upload-excel', upload.single('file'), addPartsFromExcel);
router.delete('/delete/:id', deletePart);
router.put('/update/:id', partImageUpload.single('image'), updatePart);
router.post('/add', partImageUpload.single('image'), addPart);
router.post('/ratePart/:partId', ratePart);
router.get('/getPartRatings/:partId', getPartRatings);
router.get('/getRecommendations/:userId', getRecommendations);
router.get('/getAllParts', getAllParts);
router.get('/getPartsbyId', getPartsbyId);
router.get('/viewPrivateParts/:userid', getCompatibleParts);
router.get('/CompatibleSpicificOrders/:userid/:role', CompatibleSpicificOrders);
router.get('/orders/:userid', getallOrdersForSeller);
router.get('/viewAllParts', viewAllParts);
router.get('/viewsellerParts/:userId', viewsellerParts);

module.exports = router;

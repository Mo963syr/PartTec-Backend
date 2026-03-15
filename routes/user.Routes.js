const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  addUser,
  viewsellerprands,
  putprands,
  getAllUsers,
  updateUserLocation,
  getAllUsersforAdmin,
  deleteUser,
  getUserData,
  updateUserData,
  addImageProfile,
  getProfileImage,
} = require('../controllers/user.Controller');
const { register, login } = require('../controllers/auth.controller');
const upload = multer({ dest: 'uploads/' });
router.post('/add', addUser);
router.post('/updateUserLocation/:userId', updateUserLocation);
router.get('/getAllUsers', getAllUsers);
router.post('/register', register);
router.post('/login', login);
router.put('/putprands/:userId', putprands);
router.get('/viewsellerprands/:userId', viewsellerprands);
router.get('/getAllUsersforAdmin', getAllUsersforAdmin);
router.delete('/deleteUser/:id', deleteUser);
router.get('/getUserData/:userId', getUserData);
router.put('/updateUserData/:userId', updateUserData);
router.post(
  '/addImageProfile/:userId',
  upload.single('image'),
  addImageProfile,
);
router.get('/getProfileImage/:userId', getProfileImage);
module.exports = router;

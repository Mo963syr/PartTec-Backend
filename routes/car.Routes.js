const express = require('express');
const router = express.Router();
const carController = require('../controllers/car.Controller');


router.post('/add/:userId', carController.addCarToUser);
router.get('/viewCars/:userId', carController.viewcar);
router.put('/edit/:carId', carController.editCar);
router.delete('/delete/:carId', carController.deleteCar);   

module.exports = router;
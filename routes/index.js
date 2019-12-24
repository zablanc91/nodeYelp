const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// Do work here
router.get('/', storeController.homePage);
router.get('/add', storeController.addStore);
//handle submitting form for new Store (_storeForm.pug)
router.post('/add', storeController.createStore);

module.exports = router;

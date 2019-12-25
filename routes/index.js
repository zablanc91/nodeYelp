const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { catchErrors }  = require('../handlers/errorHandlers');

// Do work here
router.get('/', storeController.homePage);
router.get('/add', storeController.addStore);
//handle submitting form for new Store (_storeForm.pug), this is asynchronous
router.post('/add', catchErrors(storeController.createStore));

module.exports = router;

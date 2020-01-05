const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { catchErrors }  = require('../handlers/errorHandlers');

// Do work here
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', authController.isLoggedIn, storeController.addStore);

//handle submitting form for new Store (_storeForm.pug), this is asynchronous
router.post('/add', 
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
router.post('/add/:id', 
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);
router.get('/stores/:id/edit', catchErrors(storeController.editStore));

//click on store name, redirect to individual page and display info
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);

//need to validate registration, register the user, then log in when done with registration
router.post('/register', 
  userController.validateRegister,
  userController.register,
  authController.login
);

router.post('/login', authController.login);
router.get('/logout', authController.logout);

//access to account after logged in
router.get('/account', authController.isLoggedIn,userController.account);
router.post('/account', catchErrors(userController.updateAccount));

router.post('/account/forgot', catchErrors(authController.forgot));

//clicking reset URL
router.get('/account/reset/:token', catchErrors(authController.reset));

//submitting password reset
router.post('/account/reset/:token', authController.confirmPasswords, catchErrors(authController.updatePassword));

//API Endpoints
router.get('/api/search', catchErrors(storeController.searchStores));

module.exports = router;
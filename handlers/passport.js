const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

//every single time you have a request, ask Passport what to do with user after they've logged in?
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
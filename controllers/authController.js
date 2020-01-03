const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

//will make middleware for local strategy to check if user and password sent correctly, use passport
exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in.'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out.');
    res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
    //check if user is authenticated with Passport
    if(req.isAuthenticated()){
        next();
        return;
    }
    else{
        req.flash('error', 'You must be logged in to do that.');
        res.redirect('/login');
    }
};

exports.forgot = async (req, res) => {
    //see if user exists given the email
    const user = await User.findOne({
        email: req.body.email
    });

    if(!user) {
        req.flash('Error','A password reset email has been sent.');
        return res.redirect('/login');
    }
    //set reset tokens and expiration date (1 hr later), use crypto to generate random string
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    //send an actual email with token, uses password-reset.pug @ views/emails
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

    await mail.send({
        user,
        subject: 'Password Reset',
        resetURL,
        filename: 'password-reset'
    });

    req.flash('Success', 'You have been emailed the password reset link.');
    

    //redirect to login page
    res.redirect('/login');
};

//Reset URL has been clicked
exports.reset = async (req, res) => {
    //get token from the URL(req) and check if someone has it
    //also check if the token has not yet expired
    const token = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if(!token){
        req.flash('error', 'Password reset is invalid or expired');
        return res.redirect('/login');
    }
    else{
        //show password reset form
        res.render('reset', {
            title: 'Password reset'
        });
    }
};

//check that the password and confirmed password are equal
exports.confirmPasswords = (req, res, next) => {
    if(req.body.password === req.body['password-confirm']){
        next();
        return;
    }
    
    req.flash('error', 'The two passwords must match.');
    res.redirect('back');
};

exports.updatePassword = async (req, res) => {
    //make sure the user exists and the token is still valid
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if(!user){
        req.flash('error', 'Password reset is invalid or expired');
        return res.redirect('/login');
    }
    
    //update the user's password, need to promisify setPassword (from passportLocalMongoose in User.js) because it is callback based
    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);

    //need to get rid of token and password expires fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    //save to DB then automatically log in user; req.login also from Passport
    const updatedUser = await user.save();
    await req.login(updatedUser);

    req.flash('success', 'Password has been updated.');
    res.redirect('/');
};
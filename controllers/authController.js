const passport = require('passport');

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
const mongoose = require('mongoose');

exports.loginForm = (req, res) => {
    res.render('login', {
        title: 'Login'
    });
};

exports.registerForm = (req, res) => {
    res.render('register', {
        title: 'Register'
    });
};

exports.validateRegister = (req, res, next) => {
    //sanitizeBody obtained from expressValidator() @ app.js
    //refer to https://github.com/validatorjs/validator.js
    //checks req.body.name from _registerForm.pug
    req.sanitizeBody('name');
    req.checkBody('name', 'You must supply a name.').notEmpty();
    req.checkBody('email', 'Email is not valid.').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'Password cannot be blank.').notEmpty();
    req.checkBody('password-confirm', 'Confirmed password cannot be blank.').notEmpty();
    req.checkBody('password-confirm', 'Passwords must match.').equals(req.body.password);

    //if error, display error then re-render form
    const errors = req.validationErrors();
    if(errors){
        req.flash('error', errors.map(err => err.msg ));
        res.render('register', {
            title: 'Register',
            body: req.body,
            flashes: req.flash()
        });
        return;
    }
    next();
};
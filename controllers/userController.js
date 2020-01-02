const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

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

//done after validateRegister, req.body has Name, Email, Password, and Confirm Password
exports.register = async (req, res, next) => {
    //passportLocalMongoose gives us the register function; will use register instead of save so we take password, hash it, and save it DB
    const user = new User({
        email: req.body.email,
        name: req.body.name
    });
    //make register promise based and bind to User model
    const registerWithPromise = promisify(User.register, User);
    await registerWithPromise(user, req.body.password);
    next();
    //pass it off to authController
};

exports.account = async (req, res) => {
    res.render('account', {
        title: 'Edit your account'
    });
};

//take all the data in the form and update the fields (not the hash)
exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    };

    //params to findOneAndUpdate: query, update, options
    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates },
        { new: true, runValidators: true, context: 'query'}
    );

    req.flash('success', 'Updated your profile.');
    res.redirect('/account');
};
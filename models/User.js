const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const md5 = require('md5');
const validator = require('validator');
const mongoDBErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    //validate args: 1st is how to validate, 2nd is error message
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid Email Address.'],
        require: 'Please enter an email address.'
    },
    name: {
        type: String,
        require: 'Please enter a name.',
        trim: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

//generated gravatar with hash of email address
userSchema.virtual('gravatar').get(function() {
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
userSchema.plugin(mongoDBErrorHandler);
module.exports = mongoose.model('User', userSchema);
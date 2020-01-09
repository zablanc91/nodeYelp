const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
    createdDate: {
        type: Date,
        default: Date.now
    },
    store : { 
        type: mongoose.Schema.ObjectId, 
        ref: 'Store',
        required: 'You must supply a store.'
    },
    text: {
        type: String,
        required: 'Your review must have text.'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author.'
    }
});

module.exports = mongoose.model('Review', reviewSchema);
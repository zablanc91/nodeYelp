const mongoose = require('mongoose');
const Review = mongoose.model('Review');
const Store = mongoose.model('Store');

exports.addReview = async (req, res) => {
    //push review to DB - text and rating from form (req.body), Store id inside URL (req.params.id), User id from req.user
    //put all in req.body then make a new Review instance
    req.body.author = req.user._id;
    req.body.store = req.params.id
    
    const newReview = new Review(req.body);
    await newReview.save();
    
    req.flash('success', 'Review created.');
    res.redirect('back');
};
const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req, res) => {
    res.render('index', {
        title: 'YELP V2'
    });
};

//note: we'll use same template whether we add or edit store
exports.addStore = (req, res) => {
    res.render('editStore', {
        title: 'Add Store'
    });
};

//after user submits form, save to DB
exports.createStore = async (req, res) => {
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
};
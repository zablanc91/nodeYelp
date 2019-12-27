const mongoose = require('mongoose');
const Store = mongoose.model('Store');
//to handle multipart form data (img upload)
const multer = require('multer');

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

//first query the DB for list of all stores then render
exports.getStores = async (req, res) => {
    const stores = await Store.find();
    res.render('stores', {
        title: 'Stores',
        stores
    });
};

//find the store given the id
//confirm owner of the store is logged in (TODO LATER)
//render out edit form
exports.editStore = async (req, res) => {
    const store = await Store.findOne({
        _id: req.params.id
    });
    res.render('editStore', {
        title: `Edit ${store.name}`,
        store
    });
};

//for the Save button when editing a store
//need to find and update the store and signal success if so
exports.updateStore = async (req, res) => {
    //params: query, data (for us in req.body), options (set new = true to return new store instead of old and runValidators = true to make sure required fields filled out)

    //store's location type gets 'unset' on edit, need to ensure it is Point
    req.body.location.type = 'Point';
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {new: true, runValidators: true}).exec();
    req.flash('success', `Successfully edited ${store.name}. <a href="/stores/${store.slug}">View the Store</a>`);
    res.redirect(`/stores/${store._id}/edit`);
}
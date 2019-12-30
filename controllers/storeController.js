const mongoose = require('mongoose');
const Store = mongoose.model('Store');
//to handle multipart form data (img upload)
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

//setup for multer - where to store file and what types
const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto){
            next(null, true);
        }
        else{
            next({message: 'Invalid file type.'}, false);
        }
    }
};

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

//middleware to upload and read to memory, use before createStore
exports.upload = multer(multerOptions).single('photo');

//middleware to resize img, use before createStore
exports.resize = async (req, res, next) => {
    //skip this middleware if no file
    if(!req.file){
        next();
        return;
    }

    //pull out the file extension then use uuid is used to generate a unique name
    //save photo to req.body to for the store 
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`; 

    //resize, read takes filepath or a buffer
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);

    //write to folder
    await photo.write(`./public/uploads/${req.body.photo}`);

    next();
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
};

//clicking on store name to display info
exports.getStoreBySlug = async (req, res, next) => {
    //only info we have to go by is slug in the req.params
    const store = await Store.findOne({
        slug: req.params.slug
    });

    //no store to query, 404
    if(!store){
        return next();
    }

    res.render('store', {
        store
    });
};

//need to get list of all stores, get tags, then sum up tags
exports.getStoresByTag = async (req, res) => {
    const tags = await Store.getTagsList();
    const tagName = req.params.tag;
    res.render('tags', {
        tags,
        title: 'Tags',
        tagName
    });
};
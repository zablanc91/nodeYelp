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
    req.body.author = req.user._id;
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

//helper function, compares Store's author object ID with User's String _id
const confirmOwner = (store, user) => {
    if(!store.author.equals(user._id)){
        throw Error('You need to own the store in order to edit it.');
    }
};

//find the store given the id
//confirm owner of the store is logged in
//render out edit form
exports.editStore = async (req, res) => {
    const store = await Store.findOne({
        _id: req.params.id
    });
    confirmOwner(store, req.user);
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

//get tags, get stores for each tag, then sum up tags
exports.getStoresByTag = async (req, res) => {
    const tagName = req.params.tag;
    //on initial visit to tags no tag is selected; we need to show all stores
    const tagQuery = tagName || {$exists: true};
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({tags: tagQuery});

    const result = await Promise.all([tagsPromise, storesPromise]);

    let tags = result[0];
    let stores = result[1];
    res.render('tags', {
        tags,
        stores,
        tagName
    });
};

//utilize index made on Store name and description
exports.searchStores = async (req, res) => {
    //fields indexed as text, use text search
    //meta set to have 'score' based on occurence of word, sort from highest to lowest
    const stores = await Store
    .find({
        $text: { $search: req.query.q }
    }, {
        score: { $meta: 'textScore' }
    })
    .sort({
        score: { $meta: 'textScore'}
    })
    .limit(5);

    res.json(stores);
};

exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    
    //need query to search for stores where location property is near, max distance of 10 miles
    const query = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 16093 //meters to miles
            }
        }
    };

    const stores = await Store.find(query).select('slug name description location photo').limit(10);
    res.json(stores);
};

exports.mapPage = (req, res) => {
    res.render('map', {
        title: 'Map'
    });
};
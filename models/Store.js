const mongoose = require('mongoose');
//needed for built in ES6 promises with async await
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name!'
    } ,
    slug: String,
    description: {
        type: String,
        trime: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        //lng then lat inside coordinates array
        coordinates: [{
            type: Number, 
            required: 'You must supply coordinates.'
        }],
        address: {
            type: String,
            required: 'You must supply an address.'
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author.'
    }
});

//auto generate slug with each save
storeSchema.pre('save', async function(next){
    //TODO in future: update slugs for unique stores
    if(!this.isModified('name')){
        return next();
    }
    this.slug = slug(this.name);

    //find other stores that have a slug of store, store-2, store-3, etc. to bump up the latest # for the newest slug
    //regex finds slugs starting with slug name and ending with -number (optional)
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?)$`, 'i');
    //access Store Model before making the actual schema, use this; return list of matches
    const storeWithSlug = await this.constructor.find({ slug: slugRegEx});

    //match found
    if(storeWithSlug.length){
        this.slug = `${this.slug}-${storeWithSlug.length + 1}`;
    }

    next();
});

//adding our own method to storeSchema to get a list of all Store tags; extract all tags from Stores with unwind, group them by tag field, then get sum
storeSchema.statics.getTagsList = function(){
    return this.aggregate([
        { $unwind: '$tags'},
        { $group: {_id: '$tags', count: { $sum: 1}}},
        {$sort: {count: -1}}
    ]);
};

module.exports = mongoose.model('Store', storeSchema);
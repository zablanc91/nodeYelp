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
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

//indexes, will use name and description help our search
storeSchema.index({
    name: 'text',
    description: 'text'
});

//index location for map
storeSchema.index({
    location: '2dsphere'
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

//make complex query for MongoDB to get top stores
storeSchema.statics.getTopStores = function(){
    return this.aggregate([
        //grab all Stores and populate the reviews (name of the new field)
        { 
            $lookup: {
                from: 'reviews', 
                localField: '_id', 
                foreignField: 'store', 
                as: 'reviews'
            }
        },
        //filter for >= 2 reviews, see if review at index 1 (the 2nd) exists
        { 
            $match: {
                'reviews.1': { $exists: true}
            }
        },
        //get avg rating of all of a Store's reviews, make new field
        //need to manually re-add some old fields with $project
        {
            $project: {
                photo: '$$ROOT.photo',
                averageRating: { $avg: '$reviews.rating'},
                name: '$$ROOT.name',
                slug: '$$ROOT.slug',
                reviews: '$$ROOT.reviews'
            }
        },
        //sort by averageRating, from high to low
        {
            $sort: {
                averageRating: -1
            }
        },
        //limit to the top 10
        {
            $limit: 10
        }
    ]);
};

//find reviews where the Store's _id is equal to Review's store property
storeSchema.virtual('reviews', {
    //go to Review model and make query
    //localField (Store) needs to match with foreignField (Review)
    ref: 'Review',
    localField: '_id',
    foreignField: 'store'
});

//include Reviews since it is a virtual field whenever we query for Stores
function autopopulate(next){
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);
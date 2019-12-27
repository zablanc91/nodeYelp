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
    }
});

//auto generate slug with each save
storeSchema.pre('save', function(next){
    //TODO in future: update slugs for unique stores
    if(!this.isModified('name')){
        return next();
    }
    this.slug = slug(this.name);
    next();
});

module.exports = mongoose.model('Store', storeSchema);
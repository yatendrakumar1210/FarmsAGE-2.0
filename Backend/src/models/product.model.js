const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Fruits', 'Vegetables', 'Organic', 'Dairy'],
        required: true
    },
    image: {
        type: String,
        required: true
    },
    isOrganic: {
        type: Boolean,
        default: false
    },
    discount: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    oldPrice: {
        type: Number,
        default: null
    },
    quantity: {
        type: Number,
        default: 100,
        min: 0
    },
    unit: {
        type: String,
        default: '1 kg'
    }

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
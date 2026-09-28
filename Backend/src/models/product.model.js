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
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }

}, { timestamps: true });

// ─── Indexes optimized for getPublicProducts sort/filter patterns ───────────
// vendorId null check + category filter
productSchema.index({ vendorId: 1, category: 1, quantity: -1, createdAt: -1 });
// Default sort: quantity desc, createdAt desc (most common hit)
productSchema.index({ quantity: -1, createdAt: -1 });
// Price sort variants
productSchema.index({ quantity: -1, price: 1 });
productSchema.index({ quantity: -1, price: -1 });
// Text search support on name
productSchema.index({ name: "text" });

module.exports = mongoose.model('Product', productSchema);

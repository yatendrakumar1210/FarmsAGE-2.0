const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: "",
        trim: true
    },
    category: {
        type: String,
        enum: ['Fruits', 'Vegetables', 'Organic', 'Dairy'],
        required: true
    },
    image: {
        type: String,
        required: true,
        trim: true
    },
    isOrganic: {
        type: Boolean,
        default: false
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    oldPrice: {
        type: Number,
        default: null,
        min: 0
    },
    quantity: {
        type: Number,
        default: 100,
        min: 0
    },
    unit: {
        type: String,
        default: '1 kg',
        trim: true
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
// Vendor product queries: { vendorId } sorted by { createdAt: -1 }
productSchema.index({ vendorId: 1, createdAt: -1 });
// Default sort: quantity desc, createdAt desc (most common hit)
productSchema.index({ quantity: -1, createdAt: -1 });
// Price sort variants
productSchema.index({ quantity: -1, price: 1 });
productSchema.index({ quantity: -1, price: -1 });
// Text search support on name
productSchema.index({ name: "text" });

module.exports = mongoose.model('Product', productSchema);


const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: true
  },
  selectedColor: {
    type: {
      name: String,
      media: {
        type: {
          type: String,
          enum: ['image', 'video'],
          default: 'image'
        },
        public_id: String,
        url: String,
        thumbnail: String
      }
    },
    default: undefined
  },
  selectedOptions: {
    type: Object,
    default: {}
  }
});

// Add a pre-save middleware to ensure consistent handling of selectedColor
cartItemSchema.pre('save', function(next) {
  // If selectedColor is empty or has no name, set it to null
  if (!this.selectedColor || !this.selectedColor.name) {
    this.selectedColor = null;
  }
  next();
});

const cartSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update total amount before saving to only count selected items
cartSchema.pre('save', async function(next) {
  // Calculate total amount only from selected items
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.isSelected ? item.price * item.quantity : 0);
  }, 0);
  
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Cart', cartSchema); 
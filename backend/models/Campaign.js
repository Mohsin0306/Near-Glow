const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [50, 'Title cannot be more than 50 characters']
    },
    link: {
      type: String,
      required: false,
      default: '',
      trim: true
    },
    description: {
      type: String,
      required: false,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    image: {
      url: {
        type: String,
        required: true
      },
      public_id: {
        type: String,
        required: true
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    // Add products array to store campaign products with discounts
    products: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
          required: true
        },
        discountPercent: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
          default: 0,
          set: function(val) {
            return parseInt(val) || 0;
          }
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Index for efficient sorting by order
CampaignSchema.index({ order: 1 });
// Index for quickly finding active campaigns
CampaignSchema.index({ isActive: 1 });
// Index for product lookups
CampaignSchema.index({ 'products.product': 1 });

module.exports = mongoose.model('Campaign', CampaignSchema); 
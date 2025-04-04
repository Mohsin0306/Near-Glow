const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  buttonText: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  buttonLink: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  media: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);

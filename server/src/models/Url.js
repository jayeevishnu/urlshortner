const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
  },
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid URL',
    },
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  urlHash: {
    type: String,
    index: true,
    sparse: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  clicks: [clickSchema],
  totalClicks: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

urlSchema.index({ shortCode: 1 });
urlSchema.index({ user: 1, createdAt: -1 });


urlSchema.methods.addClick = function(ip, userAgent) {
  this.clicks.push({ ip, userAgent });
  this.totalClicks = this.clicks.length;
  return this.save();
};


urlSchema.virtual('clicksToday').get(function() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return this.clicks.filter(click => click.timestamp > yesterday).length;
});


urlSchema.virtual('clicksThisWeek').get(function() {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return this.clicks.filter(click => click.timestamp > lastWeek).length;
});

module.exports = mongoose.model('Url', urlSchema); 
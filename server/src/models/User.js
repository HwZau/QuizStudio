const mongoose = require('mongoose');
const usernameCollation = { locale: 'en', strength: 2 };

const userSchema = new mongoose.Schema({
  username: { type: String, default: '', required: true, trim: true, minlength: 3 },
  passwordHash: { type: String, required: true, select: false },
  admin: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.index({ username: 1 }, {
  name: 'username_case_insensitive_unique',
  unique: true,
  collation: usernameCollation
});

userSchema.statics.findByUsername = function (username) {
  const value = typeof username === 'string' ? username.trim() : '';
  return this.findOne({ username: value }).collation(usernameCollation);
};

module.exports = mongoose.model('User', userSchema);

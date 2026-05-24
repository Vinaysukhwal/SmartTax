/**
 * User Model
 * 
 * Stores user account information for SmartTax.
 * Passwords are automatically hashed before saving using bcrypt.
 * 
 * Fields:
 * - name: User's full name
 * - email: Unique email address (used for login)
 * - password: Hashed password (never stored in plain text)
 * - pan: PAN card number (format: ABCDE1234F)
 * - phone: Optional phone number
 * - address: Optional address object (street, city, state, pincode)
 * - createdAt: Auto-generated timestamp
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  pan: {
    type: String,
    required: [true, 'PAN number is required'],
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g., ABCDE1234F)'],
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
  },
}, {
  // Automatically add createdAt and updatedAt fields
  timestamps: true,
});

/**
 * Pre-save hook: Hash the password before saving to database.
 * Only runs if the password field has been modified (not on every save).
 */
userSchema.pre('save', async function (next) {
  // Skip hashing if password wasn't changed
  if (!this.isModified('password')) return next();

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method: Compare a plain text password with the hashed password.
 * Used during login to verify the user's password.
 * 
 * @param {string} candidatePassword - The password to check
 * @returns {boolean} - True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

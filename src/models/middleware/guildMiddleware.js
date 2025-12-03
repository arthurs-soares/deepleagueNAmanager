/**
 * Guild schema middleware and validation hooks
 */
const { normalizeRoleToPortuguese } = require('../../utils/core/roleMapping');

/**
 * Pre-validate middleware to ensure guild leadership rules
 * @param {Function} next - Next middleware function
 */
function validateGuildLeadership(next) {
  try {
    const members = Array.isArray(this.members) ? this.members : [];

    // Normalize roles to Portuguese for consistency
    members.forEach(member => {
      if (member.role) {
        member.role = normalizeRoleToPortuguese(member.role);
      }
    });

    const leaders = members.filter(m => m.role === 'lider');
    const vices = members.filter(m => m.role === 'vice-lider');

    if (leaders.length > 1) {
      return next(new Error('The guild can only have 1 leader.'));
    }
    if (vices.length > 1) {
      return next(new Error('The guild can only have 1 co-leader.'));
    }

    // Normalize color to #RRGGBB format
    if (this.color && !this.color.startsWith('#')) {
      this.color = `#${this.color}`;
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Pre-save middleware to update timestamp
 * @param {Function} next - Next middleware function
 */
function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
}

/**
 * Apply all middleware to guild schema
 * @param {mongoose.Schema} schema - Guild schema
 */
function applyGuildMiddleware(schema) {
  // Validation middleware
  schema.pre('validate', validateGuildLeadership);

  // Save middleware
  schema.pre('save', updateTimestamp);
}

module.exports = {
  validateGuildLeadership,
  updateTimestamp,
  applyGuildMiddleware
};

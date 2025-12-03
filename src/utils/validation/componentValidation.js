// Discord component validation utilities
const LoggerService = require('../../services/LoggerService');

/**
 * Discord component limits and validation
 */
const DISCORD_LIMITS = {
  BUTTON_LABEL_MAX_CHARS: 80,
  // Estimated maximum total width for buttons in a row
  ACTION_ROW_MAX_WIDTH_ESTIMATE: 200,
  // Average character width estimation for buttons
  BUTTON_CHAR_WIDTH_ESTIMATE: 2.5
};

/**
 * Validate button label length
 * @param {string} label - Button label
 * @returns {Object} Validation result
 */
function validateButtonLabel(label) {
  if (!label || typeof label !== 'string') {
    return { valid: false, message: 'Button label must be a non-empty string' };
  }

  if (label.length > DISCORD_LIMITS.BUTTON_LABEL_MAX_CHARS) {
    return {
      valid: false,
      message: `Button label exceeds ${DISCORD_LIMITS.BUTTON_LABEL_MAX_CHARS} characters (${label.length})`
    };
  }

  return { valid: true };
}

/**
 * Estimate the total width of buttons in an ActionRow
 * @param {Array<string>} buttonLabels - Array of button labels
 * @returns {Object} Width estimation result
 */
function estimateActionRowWidth(buttonLabels) {
  if (!Array.isArray(buttonLabels)) {
    return { valid: false, message: 'Button labels must be an array' };
  }

  const totalChars = buttonLabels.reduce((sum, label) => sum + (label?.length || 0), 0);
  const estimatedWidth = totalChars * DISCORD_LIMITS.BUTTON_CHAR_WIDTH_ESTIMATE;

  const exceedsLimit = estimatedWidth > DISCORD_LIMITS.ACTION_ROW_MAX_WIDTH_ESTIMATE;

  return {
    valid: !exceedsLimit,
    estimatedWidth,
    totalChars,
    message: exceedsLimit
      ? `ActionRow width may exceed Discord limits (estimated: ${estimatedWidth}, limit: ~${DISCORD_LIMITS.ACTION_ROW_MAX_WIDTH_ESTIMATE})`
      : 'ActionRow width within acceptable limits'
  };
}

/**
 * Validate an ActionRow with multiple buttons
 * @param {Array<Object>} buttons - Array of button objects with label property
 * @returns {Object} Validation result
 */
function validateActionRow(buttons) {
  if (!Array.isArray(buttons)) {
    return { valid: false, message: 'Buttons must be an array' };
  }

  // Validate individual button labels
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const labelValidation = validateButtonLabel(button?.label);
    if (!labelValidation.valid) {
      return {
        valid: false,
        message: `Button ${i + 1}: ${labelValidation.message}`
      };
    }
  }

  // Validate total row width
  const labels = buttons.map(b => b?.label || '');
  const widthValidation = estimateActionRowWidth(labels);

  return widthValidation;
}

/**
 * Suggest shorter button labels if they're too long
 * @param {string} label - Original button label
 * @returns {Array<string>} Array of suggested shorter labels
 */
function suggestShorterLabels(label) {
  const suggestions = [];

  // Common replacements for long labels
  const replacements = {
    'Close Ticket (with Transcript)': ['Close + Transcript', 'Close Ticket', 'Close & Save'],
    'Close Thread (with Transcript)': ['Close + Transcript', 'Close Thread', 'Close & Save'],
    'Accept War': ['Accept', 'Confirm'],
    'Mark Dodge': ['Dodge', 'Mark as Dodge'],
    'Call Support': ['Support', 'Help']
  };

  if (replacements[label]) {
    suggestions.push(...replacements[label]);
  }

  // Generic shortening strategies
  if (label.includes('(with ')) {
    const shortened = label.replace(/\s*\(with [^)]+\)/, '');
    if (shortened !== label) {
      suggestions.push(shortened);
    }
  }

  if (label.includes(' and ')) {
    suggestions.push(label.replace(' and ', ' & '));
  }

  return suggestions;
}

/**
 * Safely create an ActionRow with buttons, validating width constraints
 * @param {Array<Object>} buttons - Array of button objects with label property
 * @param {Object} options - Options for handling width issues
 * @returns {Object} Result with ActionRow and validation info
 */
function createSafeActionRow(buttons, options = {}) {
  const { truncateLabels = true, maxLabelLength = 20 } = options;

  if (!Array.isArray(buttons)) {
    throw new Error('Buttons must be an array');
  }

  // Create a copy of buttons to avoid modifying originals
  let safeButtons = buttons.map(button => ({ ...button }));

  // Validate and potentially truncate labels
  if (truncateLabels) {
    safeButtons = safeButtons.map(button => {
      if (button.label && button.label.length > maxLabelLength) {
        const truncated = button.label.slice(0, maxLabelLength - 3) + '...';
        LoggerService.warn('Button label truncated', {
          original: button.label,
          truncated
        });
        return { ...button, label: truncated };
      }
      return button;
    });
  }

  // Validate total width
  const labels = safeButtons.map(b => b.label || '');
  const validation = estimateActionRowWidth(labels);

  if (!validation.valid) {
    LoggerService.warn('ActionRow width validation failed:', {
      message: validation.message
    });

    // If still too wide, try more aggressive truncation
    if (truncateLabels) {
      const shorterLength = Math.max(8, Math.floor(maxLabelLength * 0.7));
      safeButtons = safeButtons.map(button => {
        if (button.label && button.label.length > shorterLength) {
          const truncated = button.label.slice(0, shorterLength - 3) + '...';
          return { ...button, label: truncated };
        }
        return button;
      });

      // Re-validate
      const newLabels = safeButtons.map(b => b.label || '');
      const newValidation = estimateActionRowWidth(newLabels);

      return {
        buttons: safeButtons,
        validation: newValidation,
        truncated: true
      };
    }
  }

  return {
    buttons: safeButtons,
    validation,
    truncated: false
  };
}

module.exports = {
  DISCORD_LIMITS,
  validateButtonLabel,
  estimateActionRowWidth,
  validateActionRow,
  suggestShorterLabels,
  createSafeActionRow
};

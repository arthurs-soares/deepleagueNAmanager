module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Enforce no console.log (use LoggerService instead)
    'no-console': ['warn', {
      allow: ['warn', 'error', 'info']
    }],

    // File/function length - relaxed for practical use
    'max-lines': ['warn', {
      max: 200,
      skipBlankLines: true,
      skipComments: true
    }],
    'max-lines-per-function': ['warn', {
      max: 80,
      skipBlankLines: true,
      skipComments: true,
      IIFEs: true
    }],

    // Code style - relaxed
    'indent': ['warn', 2, { SwitchCase: 1 }],
    'linebreak-style': 'off',
    'quotes': ['warn', 'single', {
      avoidEscape: true,
      allowTemplateLiterals: true
    }],
    'semi': ['warn', 'always'],
    'max-len': ['warn', {
      code: 150,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreComments: true,
      ignoreUrls: true,
      ignoreRegExpLiterals: true
    }],

    // Best practices
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrors: 'none'
    }],
    'no-empty': ['warn', {
      allowEmptyCatch: true
    }],
    'prefer-const': 'warn',
    'no-var': 'error',

    // Async/await preference (info only)
    'no-restricted-syntax': [
      'off'
    ],

    // Additional relaxed rules
    'no-trailing-spaces': 'warn',
    'eol-last': ['warn', 'always'],
    'comma-dangle': ['warn', 'only-multiline'],
    'object-curly-spacing': ['warn', 'always'],
    'array-bracket-spacing': ['warn', 'never'],
    'space-before-function-paren': ['warn', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }]
  },
  overrides: [
    {
      // Allow console in scripts, tests, and debug/utility files
      files: [
        'scripts/**/*.js',
        'tests/**/*.js',
        'test-*.js',
        '**/deploy*.js',
        '**/wagerEloResetTo800.js',
        'src/utils/system/**/*.js'
      ],
      rules: {
        'no-console': 'off',
        'max-lines': 'off',
        'max-lines-per-function': 'off',
        'no-unused-vars': 'off'
      }
    },
    {
      // Commands - slightly more flexible but still strict
      files: [
        'src/commands/**/*.js'
      ],
      rules: {
        'max-lines': ['warn', { max: 250 }],
        'max-lines-per-function': ['warn', { max: 140 }]
      }
    },
    {
      // Models - allow more lines for schema definitions
      files: [
        'src/models/**/*.js'
      ],
      rules: {
        'max-lines': ['warn', { max: 300 }],
        'max-lines-per-function': ['warn', { max: 100 }]
      }
    },
    {
      // Handlers - slightly more flexible
      files: [
        'src/handlers/**/*.js'
      ],
      rules: {
        'max-lines': ['warn', { max: 200 }],
        'max-lines-per-function': ['warn', { max: 80 }]
      }
    },
    {
      // Interactions (buttons, modals, selects)
      files: [
        'src/interactions/**/*.js'
      ],
      rules: {
        'max-lines': ['warn', { max: 250 }],
        'max-lines-per-function': ['warn', { max: 170 }],
        'max-len': 'off'
      }
    },
    {
      // Utils - allow slightly larger for complex logic
      files: [
        'src/utils/**/*.js'
      ],
      rules: {
        'max-lines': ['warn', { max: 300 }],
        'max-lines-per-function': ['warn', { max: 200 }],
        'max-len': 'off'
      }
    },
    {
      // Services - allow more for business logic
      files: ['src/services/**/*.js'],
      rules: {
        'max-lines': ['warn', { max: 250 }],
        'max-lines-per-function': ['warn', { max: 100 }]
      }
    },
    {
      // Config files - more permissive
      files: ['.eslintrc.js', 'src/config/**/*.js'],
      rules: {
        'max-lines': ['warn', { max: 200 }],
        'max-lines-per-function': ['warn', { max: 100 }]
      }
    },
    {
      // Core files - allow for error handling complexity
      files: ['src/core/**/*.js'],
      rules: {
        'max-lines': ['warn', { max: 200 }],
        'max-lines-per-function': ['warn', { max: 80 }]
      }
    },
    {
      // Events - allow for complex event handling
      files: ['src/events/**/*.js'],
      rules: {
        'max-lines': ['warn', { max: 200 }],
        'max-lines-per-function': ['warn', { max: 80 }]
      }
    }
  ]
};

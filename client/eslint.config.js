module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
    },
    plugins: [
        '@typescript-eslint'
    ],
    rules: {
        // Catch unused variables
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                'args': 'all',
                'argsIgnorePattern': '^_',
                'varsIgnorePattern': '^_',
                'caughtErrorsIgnorePattern': '^_',
                'destructuredArrayIgnorePattern': '^_'
            }
        ],

        // Catch unused parameters
        'no-unused-vars': 'off', // Use TypeScript version instead

        // Prefer const for variables that aren't reassigned
        'prefer-const': 'error',

        // No redundant variable declarations
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',

        // No duplicate variable declarations
        'no-redeclare': 'error',
        '@typescript-eslint/no-redeclare': 'error',

        // Catch unnecessary type assertions
        '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

        // No explicit any
        '@typescript-eslint/no-explicit-any': 'warn',

        // Catch console statements in production code
        'no-console': ['warn', { allow: ['warn', 'error'] }]
    },
    overrides: [
        {
            files: ['*.ts'],
            rules: {
                // TypeScript specific rules
                '@typescript-eslint/explicit-function-return-type': 'off',
                '@typescript-eslint/no-explicit-any': 'warn'
            }
        }
    ],
    ignorePatterns: [
        'dist/',
        'node_modules/',
        '.angular/'
    ]
};
/* eslint-disable import/no-commonjs, import/unambiguous */
module.exports = {
    env: {
        es2021: true,
        node:   true,
        jest:   true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        '@silver886/eslint-config/typescript',
        'prettier',
    ],
    parser:  '@typescript-eslint/parser',
    plugins: [
        'prettier',
    ],
    rules: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'prettier/prettier': 'error',
    },
};

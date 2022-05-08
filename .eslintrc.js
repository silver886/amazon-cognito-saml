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
    ],
    parser: '@typescript-eslint/parser',
    rules:  {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'import/no-nodejs-modules': ['off'],
    },
};

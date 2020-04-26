module.exports = {
    "plugins": [
        "nova"
    ],
    "env": {
        "commonjs": true,
        "es6": true,
        "nova/nova": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "indent": [ "error", 4 ],
        "linebreak-style": [ "error", "unix" ],
        "quotes": [ "error", "double" ],
        "semi": [ "error", "always" ]
    }
};
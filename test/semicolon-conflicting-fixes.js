// https://github.com/eslint/eslint/tree/4d35a81c9ddae2e77409bb6d82adeb62e1e1c33c/tests/fixtures/autofix

/* eslint semi: ["error", "never"] */
/* eslint no-extra-semi: "error" */
var foo = function(){};
;[1].map(foo)

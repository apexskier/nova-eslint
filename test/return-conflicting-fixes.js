// https://github.com/eslint/eslint/tree/4d35a81c9ddae2e77409bb6d82adeb62e1e1c33c/tests/fixtures/autofix

/* eslint no-else-return: "error" */
/* eslint no-useless-return: "error" */
/* eslint no-trailing-spaces: "error" */
function f() {
	if (true) {
		return;
	} else {
		return 1;
	}
}

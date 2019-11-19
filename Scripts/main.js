// 
// ESLint Extension for Nova
// main.js
//
// Copyright © 2019 Justin Mecham. All rights reserved.
// 

const Linter = require("Linter");

exports.activate = function() {
  const linterInstance = new Linter();
  nova.subscriptions.add(linterInstance);
};

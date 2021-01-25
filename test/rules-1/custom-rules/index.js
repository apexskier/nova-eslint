module.exports = {
  rules: {
    "test-rule": {
      create: function (context) {
        return {
          TemplateLiteral(node) {
            context.report(node, "template literals show test-rule error");
          },
        };
      },
    },
  },
};

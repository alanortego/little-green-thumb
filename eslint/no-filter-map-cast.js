const noFilterMapCast = {
  meta: {
    type: "suggestion",
    docs: {
      description: "disallow filter and map array functions used in a chain",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      preferFlatMap: "Prefer using `flatMap` instead of chaining `filter` and `map` with non-null cast expressions.  For example, `flatMap(i => i.foo ?? [])`.",
    },
    schema: [],
  },

  defaultOptions: [],

  create: function (context) {
    return {
      CallExpression(node) {
        if (node && isFilterMapChain(node)) {
          context.report({
            node,
            messageId: "preferFlatMap",
          });
        }
      },
    };
  },
};

export default noFilterMapCast;

function isFilterMapChain(node) {
  if (isMap(node)) {
    if (node.callee.object && isFilter(node.callee.object)) {
      if (node.arguments?.length === 1 && node.arguments[0].body && isNonNullExpression(node.arguments[0].body)) {
        return true;
      }
    }
  }

  return false;
}

function isNonNullExpression(node) {
  return node.type === "TSNonNullExpression";
}

function isMap(node) {
  return node.type === "CallExpression"
    && node.callee?.type === "MemberExpression"
    && node.callee.property?.name === "map";
}

function isFilter(node) {
  return node.type === "CallExpression" && node.callee?.property?.name === "filter";
}

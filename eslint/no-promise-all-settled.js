import { READ, ReferenceTracker } from "@eslint-community/eslint-utils";

const noPromiseAllSettled = {
  meta: {
    docs: {
      description: "disallow `Promise.allSettled` function",
      category: "ES2020",
      recommended: false,
      url: "http://mysticatea.github.io/eslint-plugin-es/rules/no-promise-all-settled.html",
    },
    fixable: null,
    messages: {
      forbidden: "ES2020 'Promise.allSettled' function is forbidden.",
    },
    schema: [],
    type: "problem",
  },
  create(context) {
    return {
      "Program:exit"(node) {
        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const scope = sourceCode.getScope ? sourceCode.getScope(node) : context.getScope();
        const tracker = new ReferenceTracker(scope)
        for (const { node } of tracker.iterateGlobalReferences({
          Promise: { allSettled: { [READ]: true } },
        })) {
          context.report({ node, messageId: "forbidden" })
        }
      },
    }
  },
};

export default noPromiseAllSettled;

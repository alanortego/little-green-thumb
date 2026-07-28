export default function createNamingConventions(allowInterfacePrefix) {
  return [
    {
      selector: "default",
      leadingUnderscore: "forbid",
      trailingUnderscore: "forbid",
      format: ["strictCamelCase"]
    },
    {
      // We can't control the naming conventions of third party modules,
      // so this means rules on properties cannot be enforced.
      selector: "import",
      format: null
    },
    {
      // We can't control the naming conventions of third party modules,
      // so this means rules on properties cannot be enforced.
      selector: "property",
      format: null
    },
    {
      selector: "variable",
      format: ["strictCamelCase", "UPPER_CASE", "PascalCase"]
    },
    {
      selector: "typeLike",
      format: ["PascalCase"]
    },
    {
      // Quoted method names don't have a naming convention
      selector: "objectLiteralMethod",
      format: null,
      modifiers: ["requiresQuotes"],
    },
    {
      selector: "function",
      format: ["strictCamelCase","PascalCase"]
    },
    {
      selector: "interface",
      format: ["PascalCase"],
      custom: allowInterfacePrefix !== true ? {
        regex: "^I[A-Z]",
        match: false
      } : undefined
    },
    {
      selector: "enumMember",
      format: ["PascalCase"]
    },
    {
      selector: "parameter",
      format: ["strictCamelCase", "PascalCase"]
    },
    {
      selector: "parameter",
      filter: { regex: "^_", match: true },
      prefix: ["_"],
      format: ["camelCase"]
    }
  ];
}

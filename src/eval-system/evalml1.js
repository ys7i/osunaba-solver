const Language = require("lex-bnf");

const { syntax, literal: lit, numlit } = Language;

const calc = new Language([
  syntax(
    "top",
    [
      ["if-exp", lit("evalto"), "nat-exp"],
      ["if-exp", lit("evalto"), "bool-exp"],
      ["nat-pt"],
    ],
    (term) => {
      const terms = [].concat(...term.contents());
      if (terms.length > 1) {
        return {
          type: "eval",
          body: terms[0],
          value: terms[2],
          content: `${terms[0].content} evalto ${terms[2].content}`,
        };
      }
      return terms[0];
    }
  ),
  syntax(
    "if-exp",
    [
      [lit("if"), "less-exp", lit("then"), "less-exp", lit("else"), "less-exp"],
      ["less-exp"],
    ],
    (term) => {
      let terms = [].concat(...term.contents());
      if (terms.length > 1) {
        return {
          type: "if",
          guard: terms[1],
          left: terms[3],
          right: terms[5],
          content: `if ${terms[1].content} then ${terms[3].content} else ${terms[5].content}`,
        };
      }
      return terms[0];
    }
  ),
  syntax(
    "less-exp",
    [
      ["as-exp", lit("lt"), "as-exp"],
      // [lit("("), "less-exp", lit(")")],
      ["as-exp"],
      ["bool-exp"],
    ],
    (term) => {
      const terms = [].concat(...term.contents());
      // if (terms[0] === "(") {
      //   terms[1].content = "(" + terms[1] + ")";
      //   return terms[1];
      // }
      if (terms.length === 1) {
        return terms[0];
      }
      let tree = {
        type: "lt",
        left: terms[0],
        right: terms[2],
        content: `${terms[0].content} < ${terms[2].content}`,
      };
      return tree;
    }
  ),
  syntax(
    "as-exp",
    [
      ["mult-exp", "as-exp-rest*"],
      [lit("("), "as-exp", lit(")")],
    ],
    (term) => {
      const terms = [].concat(...term.contents());
      if (terms[0] === "(") {
        terms[1].content = "(" + terms[1] + ")";
        return terms[1];
      }
      if (terms.length === 1) {
        return terms[0];
      }
      let tree =
        terms[1].type === "add-rest"
          ? {
              type: "add",
              left: terms[0],
              right: terms[1].data,
              content: `${terms[0].content} + ${terms[1].data.content}`,
            }
          : {
              type: "subtract",
              left: terms[0],
              right: terms[1].data,
              content: `${terms[0].content} - ${terms[1].data.content}`,
            };
      for (let i = 2; i < terms.length; i++) {
        tree =
          terms[i].type === "add-rest"
            ? {
                type: "add",
                left: tree,
                right: terms[i].data,
                content: `${tree.content} + ${terms[i].data.content}`,
              }
            : {
                type: "subtract",
                left: tree,
                right: terms[i].data,
                content: `${tree.content} - ${terms[i].data.content}`,
              };
      }
      return tree;
    }
  ),
  syntax(
    "as-exp-rest",
    [
      [lit("+"), "mult-exp"],
      [lit("-"), "mult-exp"],
    ],
    (term) => {
      const terms = [].concat(...term.contents());
      if (terms[0] === "+") {
        return { type: "add-rest", data: terms[1] };
      }
      return { type: "subtract-rest", data: terms[1] };
    }
  ),
  syntax(
    "mult-exp",
    [
      ["brace-exp", "mult-exp-rest*"],
      ["nat-exp", "mult-exp-rest*"],
      [(lit("("), "if-exp", lit(")"))],
      ["if-exp"],
    ],
    (term) => {
      const terms = [].concat(...term.contents());
      if (terms.length === 1) {
        return terms[0];
      }
      if (terms[0] === "(") {
        terms[1].content = "(" + terms[1].content + ")";
        return terms[1];
      }
      if (terms.length === 1) {
        return terms[0];
      }
      let tree = {
        type: "mult",
        left: terms[0],
        right: terms[1],
        content: `${terms[0].content} * ${terms[1].content}`,
      };
      for (let i = 2; i < terms.length; i++) {
        tree = {
          type: "mult",
          left: tree,
          right: terms[i],
          content: `${tree.content} * ${terms[i].content}`,
        };
      }
      return tree;
    }
  ),
  syntax(
    "mult-exp-rest",
    [
      [lit("*"), "brace-exp"],
      [lit("*"), "nat-exp"],
    ],
    (term) => {
      const terms = [].concat(...term.contents());
      return terms[1];
    }
  ),
  syntax("brace-exp", [[lit("("), "as-exp", lit(")")]], (term) => {
    const terms = [].concat(...term.contents());
    tree = terms[1];
    tree.content = "(" + tree.content + ")";
    return tree;
  }),
  syntax(
    "nat-pt",
    [
      ["nat-exp", lit("plus"), "nat-exp", lit("is"), "nat-exp"],
      ["nat-exp", lit("times"), "nat-exp", lit("is"), "nat-exp"],
      ["nat-exp", lit("minus"), "nat-exp", lit("is"), "nat-exp"],
      ["nat-exp", lit("less"), lit("than"), "nat-exp", lit("is"), "bool-exp"],
    ],
    (term) => {
      const terms = [].concat(...term.contents());
      switch (terms[1]) {
        case "plus":
          return {
            type: "plus",
            left: terms[0],
            right: terms[2],
            value: terms[4],
            content: `${terms[0].content} plus ${terms[2].content} is ${terms[4].content}`,
          };
        case "times":
          return {
            type: "times",
            left: terms[0],
            right: terms[2],
            value: terms[4],
            content: `${terms[0].content} times ${terms[2].content} is ${terms[4].content}`,
          };
        case "minus":
          return {
            type: "minus",
            left: terms[0],
            right: terms[2],
            value: terms[4],
            content: `${terms[0].content} minus ${terms[2].content} is ${terms[4].content}`,
          };
        case "less":
          return {
            type: "less",
            left: terms[0],
            right: terms[3],
            value: terms[5],
            content: `${terms[0].content} less than ${terms[3].content} is ${terms[5].content}`,
          };
      }
    }
  ),
  syntax("bool-exp", [[lit("true")], [lit("false")]], (term) => {
    const terms = [].concat(...term.contents());
    return {
      type: "bool",
      value: terms[0] === "true",
      content: terms[1],
    };
  }),
  syntax("nat-exp", [[numlit], [lit("-"), numlit]], (term) => {
    const terms = [].concat(...term.contents());
    if (terms.length === 2) {
      return {
        type: "nat",
        value: parseInt(terms[1]) * -1,
        content: "-" + String(terms[1]),
      };
    }
    return {
      type: "nat",
      value: parseInt(terms[0]),
      content: String(terms[0]),
    };
  }),
]);

const evalPmtlExp = (tree) => {
  const leftInt = tree.left.value;
  const rightInt = tree.right.value;
  const valueInt = Number(tree.value.value);
  switch (tree.type) {
    case "plus":
      if (leftInt + rightInt !== valueInt) {
        throw new Error();
      }
      return `${tree.content} by B-Plus {};\n`;

    case "minus":
      if (leftInt - rightInt !== valueInt) {
        throw new Error();
      }
      return `${tree.content} by B-Minus {};\n`;

    case "times":
      if (leftInt * rightInt !== valueInt) {
        throw new Error();
      }
      return `${tree.content} by B-Times {};\n`;

    case "less":
      if (leftInt < rightInt === tree.value.value) {
        return `${tree.content} by B-Lt {}\n`;
      }
    default:
      throw new Error();
  }
};

function calcBoolE(tree) {
  switch (tree.type) {
    case "bool":
      return tree.value;
    case "if":
      const guard = calcBoolE(tree.guard);
      if (guard) {
        return calcBoolE(tree.left);
      }
      return calcBoolE(tree.right);
    case "lt":
      const leftInt = calcNatE(tree.left);
      const rightInt = calcNatE(tree.right);
      return leftInt < rightInt;
    default:
      throw new Error();
  }
}

function calcNatE(tree) {
  switch (tree.type) {
    case "nat":
      return tree.value;
    case "add":
      return calcNatE(tree.left) + calcNatE(tree.right);
    case "mult":
      return calcNatE(tree.left) * calcNatE(tree.right);
    case "subtract":
      return calcNatE(tree.left) - calcNatE(tree.right);
    case "if":
      const guard = calcBoolE(tree.guard);
      if (guard) {
        return calcNatE(tree.left);
      }
      return calcNatE(tree.right);
    default:
      throw new Error();
  }
}

const evalExp = (tree) => {
  if (tree.type !== "eval") {
    return evalPmtlExp(tree);
  }

  switch (tree.body.type) {
    case "nat": {
      if (tree.body.value !== tree.value.value) {
        throw new Error();
      }
      return `${tree.content} by E-Int {};\n`;
    }

    case "bool": {
      if (tree.body.value !== tree.value.value) {
        throw new Error();
      }
      return `${tree.content} by E-Bool {};\n`;
    }

    case "if": {
      const guard = calcBoolE(tree.body.guard);
      if (guard) {
        const tree1 = {
          type: "eval",
          body: tree.body.guard,
          value: { type: "bool", value: true, content: "true" },
          content: `${tree.body.guard.content} evalto true`,
        };
        const premise1 = evalExp(tree1);
        const tree2 = {
          type: "eval",
          body: tree.body.left,
          value: tree.value,
          content: `${tree.body.left.content} evalto ${tree.value.content}`,
        };
        const premise2 = evalExp(tree2);
        return `${tree.content} by E-IfT {\n${premise1}${premise2}};\n`;
      }
      const tree1 = {
        type: "eval",
        body: tree.body.guard,
        value: { type: "bool", value: false, content: "false" },
        content: `${tree.body.guard} evalto false`,
      };
      const premise1 = evalExp(tree1);
      const tree2 = {
        type: "eval",
        body: tree.body.right,
        value: tree.value,
        content: `${tree.body.right.content} evalto ${tree.value.content}`,
      };
      const premise2 = evalExp(tree2);
      return `${tree.content} by E-IfF {\n${premise1}${premise2}};\n`;
    }

    case "add": {
      // E-Plus
      const leftInt = calcNatE(tree.body.left);
      const leftTree = {
        type: "nat",
        value: leftInt,
        content: String(leftInt),
      };
      const premise1 = evalExp({
        type: "eval",
        body: tree.body.left,
        value: leftTree,
        content: `${tree.body.left.content} evalto ${leftInt}`,
      });

      const rightInt = calcNatE(tree.body.right);
      const rightTree = {
        type: "nat",
        value: rightInt,
        content: String(rightInt),
      };
      const premise2 = evalExp({
        type: "eval",
        body: tree.body.right,
        value: rightTree,
        content: `${tree.body.right.content} evalto ${rightInt}`,
      });
      const premise3 = evalExp({
        type: "plus",
        left: leftTree,
        right: rightTree,
        value: tree.value,
        content: `${leftInt} plus ${rightInt} is ${tree.value.content}`,
      });
      return `${tree.content} by E-Plus {\n${premise1}${premise2}${premise3}};\n`;
    }

    case "subtract": {
      // E-Minus
      const leftInt = calcNatE(tree.body.left);
      const leftTree = {
        type: "nat",
        value: leftInt,
        content: String(leftInt),
      };
      const premise1 = evalExp({
        type: "eval",
        body: tree.body.left,
        value: leftTree,
        content: `${tree.body.left.content} evalto ${leftInt}`,
      });

      const rightInt = calcNatE(tree.body.right);
      const rightTree = {
        type: "nat",
        value: rightInt,
        content: String(rightInt),
      };
      const premise2 = evalExp({
        type: "eval",
        body: tree.body.right,
        value: rightTree,
        content: `${tree.body.right.content} evalto ${rightInt}`,
      });
      const premise3 = evalExp({
        type: "minus",
        left: leftTree,
        right: rightTree,
        value: tree.value,
        content: `${leftInt} minus ${rightInt} is ${tree.value.content}`,
      });
      return `${tree.content} by E-Minus {\n${premise1}${premise2}${premise3}};\n`;
    }
    case "mult": {
      // E-Times
      const leftInt = calcNatE(tree.body.left);
      const leftTree = {
        type: "nat",
        value: leftInt,
        content: String(leftInt),
      };
      const premise1 = evalExp({
        type: "eval",
        body: tree.body.left,
        value: leftTree,
        content: `${tree.body.left.content} evalto ${leftInt}`,
      });

      const rightInt = calcNatE(tree.body.right);
      const rightTree = {
        type: "nat",
        value: rightInt,
        content: String(rightInt),
      };
      const premise2 = evalExp({
        type: "eval",
        body: tree.body.right,
        value: rightTree,
        content: `${tree.body.right.content} evalto ${rightInt}`,
      });

      const premise3 = evalExp({
        type: "times",
        left: leftTree,
        right: rightTree,
        value: tree.value,
        content: `${leftInt} times ${rightInt} is ${tree.value.content}`,
      });
      return `${tree.content} by E-Times {\n${premise1}${premise2}${premise3}};\n`;
    }

    case "lt": {
      // E-Lt
      const leftInt = calcNatE(tree.body.left);
      const leftTree = {
        type: "nat",
        value: leftInt,
        content: String(leftInt),
      };
      const premise1 = evalExp({
        type: "eval",
        body: tree.body.left,
        value: leftTree,
        content: `${tree.body.left.content} evalto ${leftInt}`,
      });

      const rightInt = calcNatE(tree.body.right);
      const rightTree = {
        type: "nat",
        value: rightInt,
        content: String(rightInt),
      };
      const premise2 = evalExp({
        type: "eval",
        body: tree.body.right,
        value: rightTree,
        content: `${tree.body.right.content} evalto ${rightInt}`,
      });

      const premise3 = evalExp({
        type: "less",
        left: leftTree,
        right: rightTree,
        value: tree.value,
        content: `${leftInt} less than ${rightInt} is ${tree.value.content}`,
      });
      return `${tree.content} by E-Lt {\n${premise1}${premise2}${premise3}};\n`;
    }

    default:
      throw new Error("invalid input at evalEvalExp!");
  }
};

const calcEvalML1 = (question) => {
  const result = calc.parse(question.replace("&lt;", "lt"));
  const tree = calc.evaluate(result);
  return evalExp(tree);
};

module.exports = calcEvalML1;

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
      const terms = [].concat(...term.contents());
      if (terms.length > 1) {
        return {
          type: "eval",
          body: terms[1],
          value: terms[3],
          content: `if ${terms[1].content} then ${terms[3].content} evalto ${terms[5].content}`,
        };
      }
      return terms[0];
    }
  ),
  syntax(
    "less-exp",
    [
      ["as-exp", lit("lt"), "as-exp"],
      [lit("("), "less-exp", lit(")")],
      ["as-exp"],
      ["bool-exp"],
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
      let tree = {
        type: "less",
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
                content: `${tree.content} + ${terms[i].data.content}`,
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
    ],
    (term) => {
      const terms = [].concat(...term.contents());
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
      ["nat-exp", lit("less"), lit("than"), "nat-exp", lit("is"), "nat-exp"],
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
      type: terms[0],
      content: terms[1],
    };
  }),
  syntax("nat-exp", [[numlit]], (term) => {
    const terms = [].concat(...term.contents());
    return {
      type: "nat",
      value: parseInt(terms[0]),
      content: String(terms[0]),
    };
  }),
]);

const evalPmtlExp = (tree) => {
  const leftInt = parseInt(tree.left.value)
  const rightInt = parseInt(tree.right.value)
  const valueInt = Number(tree.value)

  switch (tree.type) {
    case "plus": 
      if((leftInt + rightInt) !== valueInt) {
        throw new Error()
      }
      return `${tree.content} by B-Plus {};\n`;

    case "minus": 
     if((leftInt - rightInt) !== valueInt) {
      throw new Error()
     } 
     return `${tree.content} by B-Minus {};\n`

    case "times":
      if((leftInt * rightInt)!==valueInt) {
        throw new Error()
      }
      return `${tree.content} by B-Times {};\n`;

    case "less":
      if((leftInt < rightInt) === (tree.value === "true")) {
        return `${tree.content} by B-Lt {}\n`
      }
    
    default:
      throw new Error();
  }
};

const evalEvalExp = (tree) => {
  if (tree.type !== "eval") {
    return evalExp(tree);
  }

  switch (tree.body.type) {
    case "succ":
    case "zero": {
      // E-Const
      if (tree.value.type !== "succ" && tree.value.type !== "zero") {
        throw new Error();
      }
      const bodyNum = natToNum(tree.body);
      const valueNum = natToNum(tree.value);
      if (bodyNum !== valueNum) {
        throw new Error("E-Const doesn't hold!");
      }
      return `${tree.content} by E-Const {};\n`;
    }
    case "add": {
      // E-Plus
      const n1 = calcAddMultNat(tree.body.left);
      const premise1 = evalEvalExp({
        type: "eval",
        body: tree.body.left,
        value: numToTree(n1),
        content: `${tree.body.left.content} evalto ${numToNat(n1)}`,
      });
      const n2 = calcAddMultNat(tree.body.right);
      const premise2 = evalEvalExp({
        type: "eval",
        body: tree.body.right,
        value: numToTree(n2),
        content: `${tree.body.right.content} evalto ${numToNat(n2)}`,
      });
      const premise3 = evalEvalExp({
        type: "plus",
        left: numToTree(n1),
        right: numToTree(n2),
        value: tree.value,
        content: `${numToNat(n1)} plus ${numToNat(n2)} is ${
          tree.value.content
        }`,
      });
      return `${tree.content} by E-Plus {\n${premise1}${premise2}${premise3}};\n`;
    }
    case "mult": {
      const n1 = calcAddMultNat(tree.body.left);
      const premise1 = evalEvalExp({
        type: "eval",
        body: tree.body.left,
        value: numToTree(n1),
        content: `${tree.body.left.content} evalto ${numToNat(n1)}`,
      });
      const n2 = calcAddMultNat(tree.body.right);
      const premise2 = evalEvalExp({
        type: "eval",
        body: tree.body.right,
        value: numToTree(n2),
        content: `${tree.body.right.content} evalto ${numToNat(n2)}`,
      });
      const premise3 = evalEvalExp({
        type: "times",
        left: numToTree(n1),
        right: numToTree(n2),
        value: tree.value,
        content: `${numToNat(n1)} times ${numToNat(n2)} is ${
          tree.value.content
        }`,
      });
      return `${tree.content} by E-Times {\n${premise1}${premise2}${premise3}};\n`;
    }
    default:
      throw new Error("invalid input at evalEvalExp!");
  }
};

const calcEvalML1 = (question) => {
  const result = calc.parse(question);
  const tree = calc.evaluate(result);
  console.log(tree);
  return evalEvalExp(tree);
};

module.exports = calcEvalML1;

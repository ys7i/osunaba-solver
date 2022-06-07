const Language = require("lex-bnf");

const { syntax, literal: lit } = Language;

const calc = new Language([
  syntax("top", [["add-exp", lit("evalto"), "nat-exp"], ["nat-pt"]], (term) => {
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
  }),
  syntax(
    "add-exp",
    [
      ["mult-exp", "add-exp-rest*"],
      [lit("("), "add-exp", lit(")")],
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
        type: "add",
        left: terms[0],
        right: terms[1],
        content: `${terms[0].content} + ${terms[1].content}`,
      };
      for (let i = 2; i < terms.length; i++) {
        tree = {
          type: "add",
          left: tree,
          right: terms[i],
          content: `${tree.content} + ${terms[i].content}`,
        };
      }
      return tree;
    }
  ),
  syntax("add-exp-rest", [[lit("+"), "mult-exp"]], (term) => {
    const terms = [].concat(...term.contents());
    return terms[1];
  }),
  syntax(
    "mult-exp",
    [
      ["brace-exp", "mult-exp-rest*"],
      ["nat-exp", "mult-exp-rest*"],
      [(lit("("), "add-exp", lit(")"))],
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
  syntax("brace-exp", [[lit("("), "add-exp", lit(")")]], (term) => {
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
  syntax(
    "nat-exp",
    [[lit("Z")], [lit("S"), lit("("), "nat-exp", lit(")")]],
    (term) => {
      const terms = [].concat(...term.contents());
      if (terms[0] == "Z") {
        return { type: "zero", content: "Z" };
      }
      return {
        type: "succ",
        next: terms[2],
        content: `S(${terms[2].content})`,
      };
    }
  ),
]);

const numToTree = (num) => {
  if (num === 0) {
    return { type: "zero", content: "Z" };
  }
  if (num > 0) {
    const tree = numToTree(num - 1);
    return {
      type: "succ",
      next: tree,
      content: `S(${tree.content})`,
    };
  }
};

const natToNum = (natTree) => {
  let tree = natTree;
  let num = 0;
  while (tree.type === "succ") {
    num += 1;
    tree = tree.next;
  }
  return num;
};

const numToNat = (num) => {
  if (num <= 0) {
    return "Z";
  }
  return `S(${numToNat(num - 1)})`;
};

const calcAddMultNat = (tree) => {
  if (tree.type === "succ" || tree.type === "zero") {
    return natToNum(tree);
  }
  if (tree.type === "add") {
    return calcAddMultNat(tree.left) + calcAddMultNat(tree.right);
  }
  if (tree.type === "mult") {
    return calcAddMultNat(tree.left) * calcAddMultNat(tree.right);
  }
  throw new Error("invalid input!");
};

const calcTimes = (tree) => {
  const leftNum = natToNum(tree.left);
  const rightNum = natToNum(tree.right);
  return leftNum * rightNum;
};

const evalExp = (tree) => {
  switch (tree.type) {
    case "plus": {
      if (tree.left.type === "zero") {
        if (tree.right.content !== tree.value.content) {
          throw new Error("this question is wrong!");
        }
        return `${tree.content} by P-Zero {};\n`;
      }
      const leftNum = natToNum(tree.left);
      const newLeftNum = numToNat(leftNum - 1);
      const valueNum = natToNum(tree.value);
      const newValueNum = numToNat(valueNum - 1);
      const newTree = {
        ...tree,
        left: tree.left.next,
        value: tree.value.next,
        content: `${newLeftNum} plus ${tree.right.content} is ${newValueNum} `,
      };
      const premise = evalExp(newTree);
      return `${tree.content} by P-Succ {\n${premise}};\n`;
    }
    case "times": {
      if (tree.left.type === "zero") {
        if (tree.value.type !== "zero") {
          throw new Error("this question is wrong");
        }
        return `${tree.content} by T-Zero {};\n`;
      }
      const leftMinus1 = tree.left.content.replace(/(?:^S\()|(?:\)$)/g, "");
      const newTree = { ...tree, left: tree.left.next };
      const n3 = calcTimes(newTree);
      const natN3 = numToNat(n3);
      const premiseLexered = calc.parse(
        `${leftMinus1} times ${tree.right.content} is ${natN3}`
      );
      const premise1Tree = calc.evaluate(premiseLexered);
      const premise1 = evalExp(premise1Tree);
      const premise2Tree = {
        type: "plus",
        left: tree.right,
        right: premise1Tree.value,
        value: tree.value,
        content: `${tree.right.content} plus ${premise1Tree.value.content} is ${tree.value.content}`,
      };
      const premise2 = evalExp(premise2Tree);
      return `${tree.content} by T-Succ {\n${premise1}${premise2}};\n`;
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

const calcEvalNatExp = (question) => {
  const result = calc.parse(question);
  const tree = calc.evaluate(result);
  return evalEvalExp(tree);
};

module.exports = calcEvalNatExp;

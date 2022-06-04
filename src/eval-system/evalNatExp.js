const Language = require("lex-bnf");

const { syntax, literal: lit, numlit } = Language;

const calc = new Language([
  syntax("top", [["add-exp", lit("evalto"), "nat-exp"]], (term) => {
    const terms = [].concat(...term.contents());
    return {
      type: "eval",
      body: terms[0],
      value: terms[2],
      content: `${terms[0].content} evalto ${terms[2].content}`,
    };
  }),
  syntax(
    "add-exp",
    [
      ["mult-exp", "add-exp-rest"],
      [lit("("), "mult-exp", "add-exp-rest", lit(")")],
    ],
    (term) => {
      const terms = [].concat(...term.contents());
      const addExpRest = terms.length === 2 ? terms[1] : terms[2];
      const litLeft = terms.length === 2 ? "" : "(";
      const litRight = terms.length === 2 ? "" : ")";
      return {
        type: "add",
        body: terms[0],
        value: addExpRest[2],
        content: `${litLeft} ${terms[0].content} evalto ${terms[2].content} ${litRight}`,
      };
    }
  ),
  syntax(
    "nat-pt",
    [
      ["nat-exp", lit("plus"), "nat-exp", lit("is"), "nat-exp"],
      ["nat-exp", lit("times"), "nat-exp", lit("is"), "nat-exp"],
    ],
    (term) => {
      const terms = [].concat(...term.contents());
      if (terms[1] == "plus") {
        return {
          type: "plus",
          left: terms[0],
          right: terms[2],
          value: terms[4],
          content: `${terms[0].content} plus ${terms[2].content} is ${terms[4].content}`,
        };
      }
      return {
        type: "times",
        left: terms[0],
        right: terms[2],
        value: terms[4],
        content: `${terms[0].content} times ${terms[2].content} is ${terms[4].content}`,
      };
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
      throw new Error("plus or times!");
  }
};

const calcNat = (question) => {
  const result = calc.parse(question);
  const tree = calc.evaluate(result);
  return evalExp(tree);
};

module.exports = calcNat;

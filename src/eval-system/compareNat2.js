const Language = require("lex-bnf");

const { syntax, literal: lit, numlit } = Language;

const calc = new Language([
  syntax(
    "top",
    [["nat-exp", lit("is"), lit("less"), lit("than"), "nat-exp"]],
    (term) => {
      const terms = [].concat(...term.contents());
      return {
        type: "less",
        left: terms[0],
        right: terms[4],
        content: `${terms[0].content} is less than ${terms[4].content}`,
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

const evalExp = (tree) => {
  const leftNum = natToNum(tree.left);
  const rightNum = natToNum(tree.right);
  if (leftNum >= rightNum) {
    throw new Error();
  }
  if (leftNum === 0 && rightNum > 0) {
    return `${tree.content} by L-Zero {};\n`;
  }
  if (leftNum <= 0 || rightNum <= 0) {
    throw new Error();
  }
  const premiseTree = {
    ...tree,
    left: tree.left.next,
    right: tree.right.next,
    content: `${tree.left.next.content} is less than ${tree.right.next.content}`,
  };
  const premise = evalExp(premiseTree);
  return `${tree.content} by L-SuccSucc {\n${premise}};\n`;
};

const calcCompareNat2 = (question) => {
  const result = calc.parse(question);
  const tree = calc.evaluate(result);
  return evalExp(tree);
};

module.exports = calcCompareNat2;

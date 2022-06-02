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

const numToNat = (num) => {
  if (num <= 0) {
    return "Z";
  }
  return `S(${numToNat(num - 1)})`;
};

const evalExp = (tree) => {
  const leftNum = natToNum(tree.left);
  const rightNum = natToNum(tree.right);
  if (leftNum >= rightNum) {
    throw new Error();
  }
  if (leftNum + 1 === rightNum) {
    return `${tree.content} by L-Succ {};\n`;
  }
  const n2Num = natToNum(tree.right.next);
  const n2Nat = numToNat(n2Num);
  const premiseTree1 = {
    ...tree,
    right: tree.right.next,
    content: `${tree.left.content} is less than ${n2Nat}`,
  };
  const premise1 = evalExp(premiseTree1);
  const premiseTree2 = {
    ...tree,
    left: tree.right.next,
    content: `${n2Nat} is less than ${tree.right.content}`,
  };
  const premise2 = evalExp(premiseTree2);
  return `${tree.content} by L-Trans {\n${premise1}${premise2}};\n`;
};

const calcCompareNat1 = (question) => {
  const result = calc.parse(question);
  const tree = calc.evaluate(result);
  return evalExp(tree);
};

module.exports = calcCompareNat1;

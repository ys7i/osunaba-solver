const Language = require("lex-bnf");

const { syntax, literal: lit } = Language;

const calc = new Language([
  syntax(
    "top",
    [
      ["add-exp", lit("darr"), "add-exp"],
      ["add-exp", lit("sarr"), "add-exp"],
      ["add-exp", lit("narr"), "add-exp"],
      ["nat-pt"],
    ],
    (term) => {
      const terms = [].concat(...term.contents());
      if (terms.length > 1) {
        if (terms[1] === "narr") {
          return {
            type: "narr",
            body: terms[0],
            value: terms[2],
            content: `${terms[0].content} ---> ${terms[2].content}`,
          };
        } else if (terms[1] === "darr") {
          return {
            type: "darr",
            body: terms[0],
            value: terms[2],
            content: `${terms[0].content} -d-> ${terms[2].content}`,
          };
        } else if (terms[1] === "sarr") {
          return {
            type: "sarr",
            body: terms[0],
            value: terms[2],
            content: `${terms[0].content} -*-> ${terms[2].content}`,
          };
        }
        return null;
      }
      return terms[0];
    }
  ),
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

const checkSameAMTree = (tree1, tree2) => {
  if (
    !["add", "mult", "succ", "zero"].includes(tree1.type) ||
    !["add", "mult", "succ", "zero"].includes(tree2.type)
  ) {
    throw new Error();
  }
  if (tree1.type === tree2.type) {
    if (tree1.type === "zero") {
      return tree2.type === "zero";
    }
    if (tree1.type === "succ") {
      return tree2.type === "succ" && checkSameAMTree(tree1.next, tree2.next);
    }
    return (
      tree1.type === tree2.type &&
      checkSameAMTree(tree1.left, tree2.left) &&
      checkSameAMTree(tree1.right, tree2.right)
    );
  }
  return false;
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

const eOneStepForward = (tree, valueTree) => {
  if (!["add", "mult"].includes(tree.type)) {
    throw new Error();
  }
  if (valueTree === null || ["succ", "zero"].includes(valueTree.type)) {
    if (
      ["succ", "zero"].includes(tree.left.type) &&
      ["succ", "zero"].includes(tree.right.type)
    ) {
      const newNum = calcAddMultNat(tree);
      return numToTree(newNum);
    }
    if (["succ", "zero"].includes(tree.left.type)) {
      const subTree = eOneStepForward(tree.right, null);
      return {
        ...tree,
        right: subTree,
        content: `${tree.left.content} ${tree.type === "add" ? "+" : "*"} ${
          subTree.content
        }`,
      };
    }
    const subTree = eOneStepForward(tree.left, null);
    return {
      ...tree,
      left: subTree,
      content: `${subTree.content} ${tree.type === "add" ? "+" : "*"} ${
        tree.right.content
      }`,
    };
  }
  const leftIsSame = checkSameAMTree(tree.left, valueTree.left);
  const rightIsSame = checkSameAMTree(tree.right, valueTree.right);
  if (leftIsSame && rightIsSame) {
    return tree;
  }

  if (
    ["succ", "zero"].includes(tree.type.left) &&
    ["succ", "zero"].includes(tree.type.right)
  ) {
    throw new Error();
  }

  if (!leftIsSame) {
    const subTree = eOneStepForward(tree.left, valueTree.left);
    return {
      ...tree,
      left: subTree,
      content: `${subTree.content} ${tree.type === "add" ? "+" : "*"} ${
        tree.right.content
      }`,
    };
  }

  const subTree = eOneStepForward(tree.right, valueTree.right);
  return {
    ...tree,
    right: subTree,
    content: `${tree.left.content}  ${tree.type === "add" ? "+" : "*"} ${
      subTree.content
    }`,
  };
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

const evalNExp = (tree) => {
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
      if (
        ["succ", "zero"].includes(tree.body.left.type) &&
        ["succ", "zero"].includes(tree.body.right.type)
      ) {
        //R-Plus
        const premise = evalExp({
          type: "plus",
          left: tree.body.left,
          right: tree.body.right,
          value: tree.value,
          content: `${tree.body.left.content} plus ${tree.body.right.content} is ${tree.value.content}`,
        });
        return `${tree.content} by R-Plus{\n${premise}};\n`;
      }
      if (tree.value.type === "add") {
        const leftIsSame = checkSameAMTree(tree.body.left, tree.value.left);
        const rightIsSame = checkSameAMTree(tree.body.right, tree.value.right);
        if (rightIsSame && !leftIsSame) {
          // R-PlusL
          const premise = evalReduceExp({
            type: "narr",
            body: tree.body.left,
            value: tree.value.left,
            content: `${tree.body.left.content} ---> ${tree.value.left.content}`,
          });
          return `${tree.content} by R-PlusL{\n${premise}};\n`;
        }
        if (!rightIsSame && leftIsSame) {
          const premise = evalReduceExp({
            type: "narr",
            body: tree.body.right,
            value: tree.value.right,
            content: `${tree.body.right.content} ---> ${tree.value.right.content}`,
          });
          return `${tree.content} by R-PlusR{\n${premise}};\n`;
        }
      }
      throw new Error();
    }
    case "mult": {
      if (
        ["succ", "zero"].includes(tree.body.left.type) &&
        ["succ", "zero"].includes(tree.body.right.type)
      ) {
        //R-Plus
        const premise = evalExp({
          type: "times",
          left: tree.body.left,
          right: tree.body.right,
          value: tree.value,
          content: `${tree.body.left.content} times ${tree.body.right.content} is ${tree.value.content}`,
        });
        return `${tree.content} by R-Times{\n${premise}};\n`;
      }
      if (tree.value.type === "mult") {
        const leftIsSame = checkSameAMTree(tree.body.left, tree.value.left);
        const rightIsSame = checkSameAMTree(tree.body.right, tree.value.right);
        if (rightIsSame && !leftIsSame) {
          // R-PlusL
          const premise = evalReduceExp({
            type: "narr",
            body: tree.body.left,
            value: tree.value.left,
            content: `${tree.body.left.content} ---> ${tree.value.left.content}`,
          });
          return `${tree.content} by R-TimesL{\n${premise}};\n`;
        }
        if (!rightIsSame && leftIsSame) {
          const premise = evalReduceExp({
            type: "narr",
            body: tree.body.right,
            value: tree.value.right,
            content: `${tree.body.right.content} ---> ${tree.value.right.content}`,
          });
          return `${tree.content} by R-TimesL{\n${premise}};\n`;
        }
      }
    }
    default:
      return evalExp(tree);
  }
};

const evalSExp = (tree) => {
  const isSame = checkSameAMTree(tree.body, tree.value);
  if (isSame) {
    return `${tree.content} by MR-Zero {};\n`;
  }
  const newTree = eOneStepForward(tree.body, tree.value);
  if (checkSameAMTree(tree.body, newTree)) {
    throw new Error();
  }

  if (checkSameAMTree(newTree, tree.value)) {
    const premise = evalNExp({
      type: "narr",
      body: tree.body,
      value: tree.value,
      content: `${tree.body.content} ---> ${tree.value.content}`,
    });
    return `${tree.content} by MR-One {\n${premise}};\n`;
  }
  const premise1 = evalSExp({
    type: "sarr",
    body: tree.body,
    value: newTree,
    content: `${tree.body.content} -*-> ${newTree.content}`,
  });
  const premise2 = evalSExp({
    type: "sarr",
    body: newTree,
    value: tree.value,
    content: `${newTree.content} -*-> ${tree.value.content}`,
  });
  return `${tree.content} by MR-Multi {\n${premise1}${premise2}};\n`;
};

const evalDExp = (tree) => {
  if (
    tree.body.type === "add" &&
    tree.body.left.type === "succ" &&
    tree.body.right.type == "succ" &&
    ["succ", "zero"].includes(tree.body.right.type)
  ) {
    // DR-PLUS
    const premise = evalExp({
      type: "plus",
      left: tree.body.left,
      right: tree.body.right,
      value: tree.value,
      content: `${tree.body.left.content} plus ${tree.body.right.content} is ${tree.value.content}`,
    });
    return `${tree.content} by DR-Plus{\n${premise}};\n`;
  }
  if (
    tree.body.type === "mult" &&
    tree.body.left.type === "succ" &&
    tree.body.right.type == "succ" &&
    ["succ", "zero"].includes(tree.body.right.type)
  ) {
    // DR-Times
    const premise = evalExp({
      type: "times",
      left: tree.body.left,
      right: tree.body.right,
      value: tree.value,
      content: `${tree.body.left.content} times ${tree.body.right.content} is ${tree.value.content}`,
    });
    return `${tree.content} by DR-Times{\n${premise}};\n`;
  }
  if (tree.body.type === "add" && tree.value.type === "add") {
    if (checkSameAMTree(tree.body.right, tree.value.right)) {
      // DR-PlusL
      const premise = evalDExp({
        type: "darr",
        body: tree.body.left,
        value: tree.value.left,
        content: `${tree.body.left.content} -d-> ${tree.value.left.content}`,
      });
      return `${tree.content} by DR-PlusL {\n${premise}};\n`;
    }
    if (
      ["succ", "zero"].includes(tree.body.left) &&
      ["succ", "zero"].includes(tree.value.left) &&
      checkSameAMTree(tree.body.left, tree.value.left)
    ) {
      // DR-PlusR
      const premise = evalDExp({
        type: "darr",
        body: tree.body.right,
        value: tree.value.right,
        content: `${tree.body.left} -d-> ${tree.value.left}`,
      });
      return `${tree.content} by DR-PlusR{\n${premise}};\n`;
    }
    throw new Error();
  }
  if (tree.body.type === "mult" && tree.value.type === "mult") {
    if (checkSameAMTree(tree.body.right, tree.value.right)) {
      // DR-TimesL
      const premise = evalDExp({
        type: "darr",
        body: tree.body.left,
        value: tree.value.left,
        content: `${tree.body.left} -d-> ${tree.value.left}`,
      });
      return `${tree.content} by DR-TimesL {\n${premise}};\n`;
    }
    if (
      ["succ", "zero"].includes(tree.body.left) &&
      ["succ", "zero"].includes(tree.value.left) &&
      checkSameAMTree(tree.body.left, tree.value.left)
    ) {
      // DR-TimesR
      const premise = evalDExp({
        type: "darr",
        body: tree.body.right,
        value: tree.value.right,
        content: `${tree.body.left} -d-> ${tree.value.left}`,
      });
      return `${tree.content} by DR-TimesR{\n${premise}};\n`;
    }
  }
  throw new Error();
};

const evalReduceExp = (tree) => {
  switch (tree.type) {
    case "plus":
      return evalExp(tree);
    case "times":
      return evalExp(tree);
    case "narr":
      return evalNExp(tree);
    case "sarr":
      return evalSExp(tree);
    case "darr":
      return evalDExp(tree);
  }
};

const calcEvalNatExp = (question) => {
  const replacedQuestion = question
    .replace(/-d-&gt;/, "darr")
    .replace(/-[\*]-&gt;/, "sarr")
    .replace(/---&gt;/, "narr");
  const result = calc.parse(replacedQuestion);
  const tree = calc.evaluate(result);
  return evalReduceExp(tree);
};

module.exports = calcEvalNatExp;

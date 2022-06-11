const calcNat = require("./eval-system/nat.js");
const calcCompareNat1 = require("./eval-system/compareNat1.js");
const calcCompareNat2 = require("./eval-system/compareNat2.js");
const calcCompareNat3 = require("./eval-system/compareNat3.js");
const calcEvalNatExp = require("./eval-system/evalNatExp.js");
const reduceNatExp = require("./eval-system/reduceNatExp.js");
const evalML1 = require("./eval-system/evalml1.js");

const solve = (question, type) => {
  try {
    switch (type) {
      case "Nat":
        return calcNat(question);
      case "CompareNat1":
        return calcCompareNat1(question);
      case "CompareNat2":
        return calcCompareNat2(question);
      case "CompareNat3":
        return calcCompareNat3(question);
      case "EvalNatExp":
        return calcEvalNatExp(question);
      case "ReduceNatExp":
        return reduceNatExp(question);
      case "EvalML1":
        return evalML1(question);
      default:
        return "Error";
    }
  } catch (e) {
    console.error(e);
    return "Error";
  }
};

module.exports = solve;

// const answer = solve(
//   "3 + (if -23 &lt; -2 * 8 then 8 else 2) + 4 evalto 15",
//   "EvalML1"
// );
// console.log(answer);

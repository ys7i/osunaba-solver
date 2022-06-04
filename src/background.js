const calcCompareNat1 = require("./eval-system/compareNat1.js");
const calcCompareNat2 = require("./eval-system/compareNat2.js");
const calcCompareNat3 = require("./eval-system/compareNat3.js");
const calcNat = require("./eval-system/nat.js");

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
      default:
        return "Error";
    }
  } catch (e) {
    console.error(e);
    return "Error";
  }
};

module.exports = solve;

// const answer = solve("S(S(Z)) plus Z is S(S(Z))", "Nat");
// console.log(answer);

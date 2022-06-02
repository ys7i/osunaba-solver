import { calcNat } from "./eval-system/nat/parser";

export const solve = (question, type) => {
  try {
    switch (type) {
      case "Nat":
        return calcNat(question);
      default:
        return "Error";
    }
  } catch (e) {
    console.error(e);
    return "Error";
  }
};

// const answer = solve("S(S(Z)) times Z is Z", "Nat");
// console.log(answer);

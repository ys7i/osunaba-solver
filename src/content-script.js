const solve = require("./background");

const question = document.getElementById("question").innerHTML;
if (question) {
  let element = document.createElement("button");
  element.textContent = "solve!";
  let target = document.querySelector("#main");
  element.style.marginTop = "20px";
  const systemStr = document
    .getElementsByTagName("p")[1]
    .innerHTML.replace(/<a [^>]*>/, "")
    .replace(/<\/a>/, "")
    .replace(/導出システム|で判断|[\s\t]/g, "");
  element.addEventListener("click", (_) => {
    const answer = solve(question, systemStr);
    document.forms[1][0].innerHTML = answer;
  });
  if (target) {
    target.appendChild(element);
  }
}

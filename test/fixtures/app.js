const main = document.getElementById("main-content");
main.className = "card";
document.querySelectorAll(".nav-link").forEach((el) => el.classList.toggle("is-active"));
document.getElementsByClassName("btn-primary")[0].classList.remove("is-active");
const button = document.querySelector("#submit-btn");

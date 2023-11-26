var x = document.getElementById("login");
var y = document.getElementById("register");
var z = document.getElementById("btn");

function register(){
    x.style.left = "-400px";
    y.style.left = "50px";
    z.style.left = "110px";
}
function login(){
    x.style.left = "50px";
    y.style.left = "450px";
    z.style.left = "0";
}
// Handle redirection after registration
if (window.location.pathname === '/register.html') {
    x.style.left = "-400px";
    y.style.left = "50px";
    z.style.left = "110px";
}
// Handle redirection after login 
if (window.location.pathname === '/login.html') {
    x.style.left = "50px";
    y.style.left = "450px";
    z.style.left = "0px";
}

// Handle redirection after successful login
if (window.location.pathname === '/home.html') {
    // Here,customize the behavior for the home page
}
if (window.location.pathname === '/index.html') {
  // Here, customize the behavior for the index page
}


const logOut = document.querySelector('.logout');

logOut.onclick = () => {
    sessionStorage.clear();
    location.href = '/index.html';
}

function submit_btn(){
  alert("Registration Successful! Please login.");
}
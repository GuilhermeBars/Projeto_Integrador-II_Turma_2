document.addEventListener("DOMContentLoaded", function() {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        alert("Você precisa estar logado!");
        window.location.href = "/login.html";
    } else {
        console.log("Usuário autenticado, token:", token);
    }
});

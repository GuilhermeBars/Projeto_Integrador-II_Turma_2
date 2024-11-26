async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("Email").value;
    const password = document.getElementById("Senha").value;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }) // Enviando no body o objeto com email e password
        });

        if (response.ok) {
            const token = await response.text();
            alert(`Login bem-sucedido! Token: ${token}`);
            // Redirecionar ou salvar o token no localStorage/sessionStorage
        } else {
            const error = await response.text();
            alert(`Erro ao logar: ${error}`);
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

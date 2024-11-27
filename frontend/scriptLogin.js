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
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();

            const token = data.token;
            const balance = data.balance;

            alert(`Login bem-sucedido! Token: ${token}, Saldo: ${balance}`);

            sessionStorage.setItem("authToken", token);
            sessionStorage.setItem("balance", balance);

            window.location.href = "/indexaftertoken.html";
        } else {
            const error = await response.text();
            alert(`Erro ao logar: ${error}`);
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro na requisição. Tente novamente mais tarde.");
    }
}

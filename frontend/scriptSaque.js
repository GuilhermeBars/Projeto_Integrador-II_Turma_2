document.addEventListener("DOMContentLoaded", async function () {
    const token = sessionStorage.getItem("authToken");

    // Verifica se o token está presente
    if (!token) {
        alert("Você precisa estar logado!");
        window.location.href = "/login.html";
        return; // Impede a execução do restante do código
    }

    console.log("Usuário autenticado, token:", token);

    // Captura o botão
    const addEventButton = document.getElementById("buttonWithdraw");

    // Adiciona o evento de clique
    addEventButton.addEventListener("click", async function () {
        const valor = document.getElementById("saqueValor").value; // Corrigido ID
        const user_id = sessionStorage.getItem("user_id");
        const method = document.getElementById("category").value;

        // Validação dos campos
        if (!valor || !method) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        const withdrawData = {
            amount: valor,
            userId: user_id,
            transferType: method,
        };

        console.log(withdrawData);

        try {
            const response = await fetch("http://localhost:3000/withdrawFunds", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(withdrawData),
            });

            if (response.ok) {
                const message = await response.text();
                alert(message);
                try {
                    const email = sessionStorage.getItem("email");
                    const password = sessionStorage.getItem("password");
                    const response = await fetch("http://localhost:3000/login", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email, password })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const balance = data.balance;
                        sessionStorage.setItem("balance", balance);
                        window.location.href = "/saque.html";
                    }
                    else {
                        const error = await response.text();
                        alert(`Erro ao obter novo saldo: ${error}`);
                    }
                } catch (error) {
                    console.error("Erro na requisição:", error);
                    alert("Erro na requisição. Tente novamente mais tarde.");
                }
            } else {
                const errorMessage = await response.text();
                alert(`Erro: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Erro ao sacar:", error);
            alert("Erro ao conectar com o servidor. Tente novamente mais tarde.");
        }
    });
});

document.addEventListener("DOMContentLoaded", async function () {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        alert("Você precisa estar logado!");
        window.location.href = "/login.html";
        return;
    }

    console.log("Usuário autenticado, token:", token);

    // Função genérica para realizar apostas
    async function placeBet(betTeam) {
        const user_id = sessionStorage.getItem("user_id");
        const event_id = sessionStorage.getItem("event_id");
        const valor = Number(document.getElementById("valor").value);

        if (!user_id || !event_id || !valor || !betTeam) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        if (valor < 1) {
            alert("Insira um valor maior que R$1,00 para apostar.");
            return;
        }

        const betData = {
            userId: user_id,
            eventId: event_id,
            betAmount: valor,
            team: betTeam,
        };

        console.log(betData);

        try {
            const response = await fetch("http://localhost:3000/betOnEvent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(betData),
            });

            if (response.ok) {
                const message = await response.text();
                alert(message);
                await updateBalanceAndRedirect();
            } else {
                const errorMessage = await response.text();
                alert(`Erro: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Erro ao realizar a aposta:", error);
            alert("Erro ao conectar com o servidor. Tente novamente mais tarde.");
        }
    }

    async function updateBalanceAndRedirect() {
        try {
            const email = sessionStorage.getItem("email");
            const password = sessionStorage.getItem("password");

            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                const balance = data.balance;
                sessionStorage.setItem("balance", balance);
                window.location.href = "/events.html";
            } else {
                const error = await response.text();
                alert(`Erro ao obter novo saldo: ${error}`);
            }
        } catch (error) {
            console.error("Erro na requisição de atualização de saldo:", error);
            alert("Erro na requisição. Tente novamente mais tarde.");
        }
    }

    // Adicionar eventos aos botões de aposta
    document.getElementById("team1").addEventListener("click", () => placeBet("1"));
    document.getElementById("team2").addEventListener("click", () => placeBet("2"));
});

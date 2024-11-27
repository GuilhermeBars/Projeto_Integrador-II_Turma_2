document.addEventListener("DOMContentLoaded", async function() {
    const token = sessionStorage.getItem("authToken");
   

    if (!token) {
        alert("Você precisa estar logado!");
        window.location.href = "/login.html";
    } else {
        console.log("Usuário autenticado, token:", token);
    }
});

// Função que será chamada ao clicar no botão
async function dep() {
    const carteiraDep = document.getElementById('carteiraDep');
    carteiraDep.innerHTML='';
    try {
        // Fazendo a requisição à API para obter o saldo
        const response = await fetch('localhost:3000/addFunds.html');  // Substitua pela URL correta
        const data = await response.json();
        const balance = data.balance;
        
        // Armazenando o saldo no sessionStorage
        sessionStorage.setItem("balance", balance);
        
        // Atualizando o conteúdo do elemento com o saldo
        carteiraDep.innerHTML = `<p>${balance}</p>`;
        console.log(balance)
    } catch (error) {
        // Caso haja um erro na requisição ou qualquer outro erro
        console.error("Erro ao atualizar o saldo:", error);
        carteiraDep.innerHTML = `<p>Erro ao carregar o saldo. Tente novamente.</p>`;
    }
}

// Adicionando o event listener para o clique no botão
document.getElementById('dep').addEventListener('click', dep);
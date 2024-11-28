document.addEventListener('DOMContentLoaded', function () {
    // Função para buscar transações do servidor
    async function getTransactions() {
      try {
        const user_id = sessionStorage.getItem('user_id');

        const transactionData = {
            user_id: user_id
        }

        const response = await fetch('http://localhost:3000/transactions', {
          method: 'POST', // ou 'GET', dependendo da sua implementação
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        });
        const transactions = await response.json(transactionData);
  
        const tableBody = document.querySelector('tbody');
        tableBody.innerHTML = ''; // Limpa a tabela antes de adicionar novos dados
  
        transactions.forEach(transaction => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <th scope="row">${transaction.TRASACTION_ID}</th>
            <td>R$${transaction.AMOUNT}</td>
            <td>${transaction.DATE_}</td> <!-- Agora mostra a data -->
            <td>${transaction.TYPE_}</td>
          `;
          tableBody.appendChild(row);
        });
      } catch (error) {
        console.error('Erro ao buscar transações:', error);
      }
    }
  
    // Chama a função para preencher a tabela quando a página carregar
    getTransactions();
  });
  
document.addEventListener('DOMContentLoaded', function () {
    // Função para buscar transações do servidor
    async function getTransactions() {
        try {
            const user_id = sessionStorage.getItem('user_id');

            console.log(user_id);

            const transactionData = {
                userID: user_id
            }

            const response = await fetch('http://localhost:3000/transactions', {
                method: 'POST', // ou 'GET', dependendo da sua implementação
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData),
              });
              
              const textResponse = await response.text(); // Pega a resposta como texto
              console.log(textResponse); // Verifique no console o que está sendo retornado
              
              // Tente analisar a resposta como JSON
              let transactions;
              try {
                transactions = JSON.parse(textResponse);
              } catch (error) {
                console.error('Erro ao analisar JSON:', error);
                return;
              }
    
            const tableBody = document.querySelector('tbody');
            tableBody.innerHTML = ''; // Limpa a tabela antes de adicionar novos dados
    
            transactions.forEach(transaction => {
                // Cria um objeto Date a partir da string de data
                const transactionDate = new Date(transaction.DATE_);
                
                // Formata a data para o formato desejado (ex: DD/MM/YYYY HH:mm)
                const formattedDate = transactionDate.toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                const row = document.createElement('tr');
                row.innerHTML = `
                    <th scope="row">${transaction.TRANSACTION_ID}</th>
                    <td>R$${transaction.AMOUNT}</td>
                    <td>${transaction.ACTION}</td>
                    <td>${transaction.TYPE_}</td>
                    <td>${formattedDate}</td>
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

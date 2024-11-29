document.addEventListener('DOMContentLoaded', function () {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        alert("Você precisa estar logado!");
        window.location.href = "/login.html";
        return;
    }
    
    async function getTransactions() {
        try {
            const user_id = sessionStorage.getItem('user_id');

            console.log(user_id);

            const transactionData = {
                userID: user_id
            }

            const response = await fetch('http://localhost:3000/transactions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData),
              });
              
              const textResponse = await response.text();
              console.log(textResponse);

              let transactions;
              try {
                transactions = JSON.parse(textResponse);
              } catch (error) {
                console.error('Erro ao analisar JSON:', error);
                return;
              }
    
            const tableBody = document.querySelector('tbody');
            tableBody.innerHTML = '';
    
            transactions.forEach(transaction => {
                const transactionDate = new Date(transaction.DATE_);
                
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
  
    getTransactions();
});

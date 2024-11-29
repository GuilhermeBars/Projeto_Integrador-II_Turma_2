document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("http://localhost:3000/getEvents");
        const data = await response.json();

        if (data.events && data.events.length > 0) {
            const table = document.getElementById("tableEvent");

            // Adiciona os eventos na tabela
            data.events.forEach(event => {
                const row = table.insertRow();

                const cellName = row.insertCell(0);
                const cellDescription = row.insertCell(1);
                const cellStartDate = row.insertCell(2);
                const cellEndDate = row.insertCell(3);
                const cellCategory = row.insertCell(4);
                const buttonBet = row.insertCell(5);

                // Preenchendo as células com os dados do evento
                cellName.textContent = event.EVENT_NAME;
                cellDescription.textContent = event.DESCRICAO; // Descrição do evento
                cellStartDate.textContent = new Date(event.EVENT_DATE_INICIO).toLocaleDateString();
                cellEndDate.textContent = new Date(event.EVENT_DATE_FIM).toLocaleDateString();
                cellCategory.textContent = event.CATEGORIA;

                // Criar botão com atributo personalizado para armazenar o EVENT_ID
                buttonBet.innerHTML = `
                    <button class="botaoapostar" data-event-id="${event.EVENT_ID}">
                        Apostar
                    </button>
                `;

                // Adiciona o evento de clique no botão
                const betButton = buttonBet.querySelector("button");
                betButton.addEventListener("click", function () {
                    // Obtém o EVENT_ID do atributo data
                    const eventId = betButton.getAttribute("data-event-id");

                    // Armazena no sessionStorage
                    sessionStorage.setItem("event_id", eventId);

                    // Redireciona para a página de aposta
                    window.location.href = "/betOnEvent.html";
                });
            });
        } else {
            const table = document.getElementById("tableEvent");
            const row = table.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 5; // Colspan para que a mensagem ocupe toda a linha da tabela
            cell.textContent = "Nenhum evento encontrado.";
            cell.style.textAlign = "center";
        }
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        const table = document.getElementById("tableEvent");
        const row = table.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 7; // Colspan para que a mensagem ocupe toda a linha da tabela
        cell.textContent = "Erro ao carregar eventos.";
        cell.style.textAlign = "center";
    }
});






document.addEventListener("DOMContentLoaded", function() {
    const searchButton = document.getElementById("searchButton");
    const searchInput = document.getElementById("searchInput");

    if (searchButton && searchInput) {
        searchButton.addEventListener("click", function(event) {
            event.preventDefault();
            const searchTerm = searchInput.value.trim(); // Pega o termo de pesquisa
            
            if (searchTerm) {
                // Armazena o termo de pesquisa no sessionStorage
                sessionStorage.setItem("searchTerm", searchTerm);

                // Redireciona para a página de busca
                window.location.href = `http://localhost:3000/searchEvents.html`
            } else {
                // Caso o campo de pesquisa esteja vazio, você pode redirecionar para a página sem parâmetro
                window.location.href = "http://localhost:3000/searchEvents.html";
            }
        });
    } else {
        console.error("Botão ou campo de pesquisa não encontrado.");
    }
});

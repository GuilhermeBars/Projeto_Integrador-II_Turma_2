document.addEventListener("DOMContentLoaded", async function () {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        alert("Você precisa estar logado!");
        window.location.href = "/login.html";
        return;
    }
    
    try {
        const response = await fetch("http://localhost:3000/getEvents");
        const data = await response.json();

        if (data.events && data.events.length > 0) {
            const table = document.getElementById("tableEvent");

            data.events.forEach(event => {
                const row = table.insertRow();

                const cellName = row.insertCell(0);
                const cellDescription = row.insertCell(1);
                const cellStartDate = row.insertCell(2);
                const cellEndDate = row.insertCell(3);
                const cellCategory = row.insertCell(4);
                const buttonBet = row.insertCell(5);

                cellName.textContent = event.EVENT_NAME;
                cellDescription.textContent = event.DESCRICAO;
                cellStartDate.textContent = new Date(event.EVENT_DATE_INICIO).toLocaleDateString();
                cellEndDate.textContent = new Date(event.EVENT_DATE_FIM).toLocaleDateString();
                cellCategory.textContent = event.CATEGORIA;

                buttonBet.innerHTML = `
                    <button class="botaoapostar" data-event-id="${event.EVENT_ID}">
                        Apostar
                    </button>
                `;

                const betButton = buttonBet.querySelector("button");
                betButton.addEventListener("click", function () {
                    const eventId = betButton.getAttribute("data-event-id");

                    sessionStorage.setItem("event_id", eventId);

                    window.location.href = "/betOnEvent.html";
                });
            });
        } else {
            const table = document.getElementById("tableEvent");
            const row = table.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 5;
            cell.textContent = "Nenhum evento encontrado.";
            cell.style.textAlign = "center";
        }
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        const table = document.getElementById("tableEvent");
        const row = table.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 7;
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
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm) {
                sessionStorage.setItem("searchTerm", searchTerm);

                window.location.href = `http://localhost:3000/searchEvents.html`
            } else {
                window.location.href = "http://localhost:3000/searchEvents.html";
            }
        });
    } else {
        console.error("Botão ou campo de pesquisa não encontrado.");
    }
});

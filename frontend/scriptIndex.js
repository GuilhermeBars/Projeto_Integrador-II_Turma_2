document.addEventListener("DOMContentLoaded", async function () {
    async function fetchEventData(url, tableId) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            const eventId = data.event?.EVENT_ID || data.events?.EVENT_ID;

            console.log(eventId);

            if (!eventId) {
                console.error("EVENT_ID não encontrado");
                displayMessage(tableId, "Nenhum evento encontrado.");
                return;
            }

            const specificResponse = await fetch("http://localhost:3000/specificEvent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    eventId: eventId
                },
            });

            const specificData = await specificResponse.json();

            console.log(specificResponse);
            console.log(specificData.events);

            if (specificData.events && specificData.events.length > 0) {
                preencherTable(tableId, specificData.events);
            } else {
                displayMessage(tableId, "Nenhum evento encontrado.");
            }
        } catch (error) {
            console.error("Erro ao carregar eventos:", error);
            displayMessage(tableId, "Erro ao carregar eventos.");
        }
    }

    function preencherTable(tableId, events) {
        const table = document.getElementById(tableId);

        events.forEach(event => {
            const row = table.insertRow();

            const cellTitle = row.insertCell(0);
            const cellEndDate = row.insertCell(1);
            const cellCategory = row.insertCell(2);

            cellTitle.textContent = event.EVENT_NAME;
            cellEndDate.textContent = new Date(event.EVENT_DATE_FIM).toLocaleDateString();
            cellCategory.textContent = event.CATEGORIA;
        });
    }

    function displayMessage(tableId, message) {
        const table = document.getElementById(tableId);
        const row = table.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 3;
        cell.textContent = message;
        cell.style.textAlign = "center";
    }

    await fetchEventData("http://localhost:3000/eventMaisApostado", "tableEvent1");
    await fetchEventData("http://localhost:3000/eventMaisProximo", "tableEvent2");
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

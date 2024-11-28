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

                cellName.textContent = event.EVENT_NAME;
                cellDescription.textContent = event.DESCRICAO;
                cellStartDate.textContent = new Date(event.EVENT_DATE_INICIO).toLocaleDateString();
                cellEndDate.textContent = new Date(event.EVENT_DATE_FIM).toLocaleDateString();
                cellCategory.textContent = event.CATEGORIA;

                const betButton = document.createElement("button");
                betButton.className = "botaoapostar";
                betButton.textContent = "Apostar";

                betButton.setAttribute("eventId", event.EVENT_ID);

                betButton.addEventListener("click", function () {
                    sessionStorage.setItem("event_id", event.EVENT_ID);
                    window.location.href = "/betOnEvent.html";
                });

                buttonBet.appendChild(betButton);
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

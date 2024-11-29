document.addEventListener("DOMContentLoaded", async function () {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        alert("Você precisa estar logado!");
        window.location.href = "/login.html";
        return;
    }
    
    const searchTerm = sessionStorage.getItem("searchTerm");
    console.log(searchTerm);

    if (searchTerm) {
        const table = document.getElementById("tableEvent");
        try {
            const response = await fetch("http://localhost:3000/searchEvents", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    keyword: searchTerm
                },
            });

            console.log("Resposta do servidor:", response);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log("Dados recebidos:", data);

            if (!data.events || !Array.isArray(data.events) || data.events.length === 0) {
                throw new Error("Nenhum evento encontrado ou formato inválido.");
            }

            table.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Título</th>
                    <th>Descrição</th>
                    <th>Data início</th>
                    <th>Data fim</th>
                    <th>Categoria</th>
                    <th> </th>
                </tr>
            `;

            data.events.forEach(event => {
                if (typeof event !== "object" || event === null || !event.EVENT_ID) {
                    console.error("Formato inesperado para evento:", event);
                    return;
                }

                const {
                    EVENT_ID,
                    EVENT_NAME,
                    DESCRICAO,
                    EVENT_DATE_INICIO,
                    EVENT_DATE_FIM,
                    CATEGORIA
                } = event;

                const row = table.insertRow();
                row.insertCell(0).textContent = EVENT_ID;
                row.insertCell(1).textContent = EVENT_NAME;
                row.insertCell(2).textContent = DESCRICAO;
                row.insertCell(3).textContent = new Date(EVENT_DATE_INICIO).toLocaleDateString();
                row.insertCell(4).textContent = new Date(EVENT_DATE_FIM).toLocaleDateString();
                row.insertCell(5).textContent = CATEGORIA;
                row.insertCell(6).innerHTML = `
                    <button class="botaoapostar">
                        <a href="/betOnEvent.html?id=${EVENT_ID}" class="aapostar">Apostar</a>
                    </button>
                `;
            });
        } catch (error) {
            console.error("Erro ao buscar eventos:", error);

            const row = table.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 7;
            cell.textContent = "Erro ao carregar eventos.";
            cell.style.textAlign = "center";
        }
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

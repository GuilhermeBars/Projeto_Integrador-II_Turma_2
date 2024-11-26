// Função principal
function paymentMethod(method) {
    const dynamicFields = document.getElementById('dynamicFields'); // Container para os campos dinâmicos

    // Limpa os campos dinâmicos antes de adicionar novos
    dynamicFields.innerHTML = '';
    

    if (method === 'pix') {
        // Adiciona os campos específicos para Pix
        dynamicFields.innerHTML = `
            <div class="form-floating mb-2" style="box-shadow: rgba(0, 0, 0, 0.534) 0px 3px 5px">
                <input type="text" class="form-control" id="pixKey" placeholder="Chave Pix">
                <label for="pixKey">Chave Pix (CPF ou Email)</label>
            </div>`;
    } else if (method === 'banco') {
        // Adiciona os campos específicos para Transferência Bancária
        dynamicFields.innerHTML = `
            <div class="form-floating mb-2" style="box-shadow: rgba(0, 0, 0, 0.534) 0px 3px 5px">
                <input type="text" class="form-control" id="contaCorrente" placeholder="Conta Corrente">
                <label for="contaCorrente">Conta Corrente</label>
            </div>
            <div class="form-floating mb-2" style="box-shadow: rgba(0, 0, 0, 0.534) 0px 3px 5px">
                <input type="text" class="form-control" id="banco" placeholder="Banco">
                <label for="banco">Banco</label>
            </div>`;
    }
}

// Adicionando os eventos de clique aos botões
document.getElementById('pix').addEventListener('click', () => paymentMethod('pix'));
document.getElementById('banco').addEventListener('click', () => paymentMethod('banco'));

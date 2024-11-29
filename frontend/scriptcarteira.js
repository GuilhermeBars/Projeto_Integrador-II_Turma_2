function paymentMethod(method) {
    const dynamicFields = document.getElementById('dynamicFields');

    dynamicFields.innerHTML = '';

    if (method === 'pix') {
        dynamicFields.innerHTML = `
            <div class="form-floating mb-2" style="box-shadow: rgba(0, 0, 0, 0.534) 0px 3px 5px">
                <input type="text" class="form-control" id="pixKey" placeholder="Chave Pix">
                <label for="pixKey">Chave Pix (CPF ou Email)</label>
            </div>`;
    } else if (method === 'banco') {
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

document.getElementById('category').addEventListener('change', (event) => {
    const method = event.target.value;
    paymentMethod(method);
});

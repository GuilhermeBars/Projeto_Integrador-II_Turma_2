document.getElementById('signUpForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Previne o envio padrão do formulário

    // Captura os dados do formulário
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const birthdate = document.getElementById('birthdate').value;

    try {
        // Envia os dados para o backend
        const response = await fetch('/signUp', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, birthdate })
        });

        if (response.ok) {
            const message = await response.text();
            alert(`Conta criada com sucesso: ${message}`);
            window.location.href = '/login.html'; // Redireciona para a página de login
        } else {
            const error = await response.text();
            alert(`Erro ao criar conta: ${error}`);
        }
    } catch (error) {
        console.error('Erro ao enviar requisição:', error);
        alert('Erro ao criar conta. Tente novamente.');
    }
});

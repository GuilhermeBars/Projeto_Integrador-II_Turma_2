
function adicionarevento() {
  var titulo = document.getElementById('titleEvent').value;
  var dataI = document.getElementById('date1').value;
  var dataF = document.getElementById('date2').value;
  var categoria = document.getElementById('category').value;
  var descricao = document.getElementById('descEvent').value; // Nova descrição

  if (titulo && dataI && dataF && categoria) {
  
      const tabela = document.getElementById('tableEvent').getElementsByTagName('tbody')[0];    
      linha = tabela.insertRow();
      

      // Inserir células na linha existente, uma para cada produto.
      var colunaTitulo = linha.insertCell(0); 
      var colunaDataI = linha.insertCell(1);
      var colunaDataF = linha.insertCell(2);
      var colunaCategoria = linha.insertCell(3);
      var colunaAcoes = linha.insertCell(4);

      colunaTitulo.innerText = titulo;
      colunaDataI.innerText = dataI;
      colunaDataF.innerText = dataF;
      colunaCategoria.innerText = categoria
      colunaAcoes.innerHTML = `
            
              <button 
                class="btn btn-outline-info btn-transparent border border-danger viewButton" 
                onclick="verEvento(this)" style="background-color: #18171f; box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;" 
                data-title="${titulo}" 
                data-category="${categoria}" 
                data-description="${descricao}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#ed1c24" class="bi bi-eye" viewBox="0 0 16 16">
                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
                </svg>
              </button>
              <button class="apostar" type="Button"><a href="/FRONT/betOnEvent.html" style="color: white";>Apostar</a></button>`;

      // Limpar os campos do formulário
      document.getElementById('titleEvent').value = '';
      document.getElementById('date1').value = '';
      document.getElementById('date2').value = '';
      document.getElementById('category').value = '';
      document.getElementById('descEvent').value = '';

      var botaoDelete = linha.querySelector('.deleteButton');
      botaoDelete.addEventListener('click', function() {
        deleteEvent(botaoDelete);  // Chama a função de exclusão com o botão como parâmetro
      });
    

      // Fechando o modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('exampleModal'));
      modal.hide();
    }
   else {
    window.alert("Preencha todos os campos!!!");
  }
}
function deleteEvent(button) {
  // Encontrar a linha mais próxima do botão clicado
  var linha = button.closest('tr');
  if (linha) {
    linha.remove();  // Remover a linha da tabela
  }
}

function verEvento(button) {
  // Encontrar a linha mais próxima do botão clicado
  var linha = button.closest('tr');
  if (linha) {
    var titulo = button.getAttribute('data-title');
    var categoria = button.getAttribute('data-category');
    var descricao = button.getAttribute('data-description');


    // Preencher os campos do modal
    document.getElementById('viewTitle').innerText = titulo;
    document.getElementById('viewDesc').innerText = descricao;
    document.getElementById('viewCategory').innerText = categoria;

    // Abrir o modal
    var modal = new bootstrap.Modal(document.getElementById('viewEventModal'));
    modal.show();
  }
  }

  
/*Passando o botão como argumento para deleteEvent(this): Agora, ao clicar no botão de excluir, estamos passando o próprio botão como argumento para a função deleteEvent. O this dentro do onclick="deleteEvent(this)" refere-se ao botão clicado.

Removendo a linha associada ao botão: Dentro da função deleteEvent, usamos o método closest('tr') para encontrar a linha (<tr>) mais próxima do botão. Depois, chamamos row.remove() para remover a linha da tabela.*/


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



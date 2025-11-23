/**
 * MÓDULO: Adição Dinâmica de Campos
 * ================================================
 * Permite adicionar campos de formulário dinamicamente.
 * Clona estrutura existente e limpa valores para novos inputs.
 */

// Configura listener do botão de adição de campo
document.querySelector('#add-time').addEventListener('click', cloneField)

/**
 * Clona campo de formulário existente
 * Cria cópia da estrutura e limpa os valores
 */
function cloneField() {
  // Clona estrutura do primeiro item de agendamento
  const newFieldContainer = document
    .querySelector('.schedule-item')
    .cloneNode(true)

  // Busca todos os inputs no elemento clonado
  const fields = newFieldContainer.querySelectorAll('input')

  // Limpa valores de todos os inputs
  fields.forEach(function (field) {
    field.value = ''
  })

  // Adiciona elemento clonado ao container de itens
  document.querySelector('#schedule-items').appendChild(newFieldContainer)
}

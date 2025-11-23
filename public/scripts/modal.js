/**
 * MÓDULO: Modal Global
 * ================================================
 * Gerencia o sistema de modais da aplicação.
 * Fornece funções para exibir alertas e solicitar confirmações do usuário.
 */

// Referências aos elementos do modal global
const modal = document.getElementById('global-modal')
const modalTitle = document.getElementById('modal-title')
const modalMessage = document.getElementById('modal-message')
const modalBtnConfirm = document.getElementById('modal-btn-confirm')
const modalBtnCancel = document.getElementById('modal-btn-cancel')
const modalContent = modal.querySelector('.modal-content')

// Armazena função resolve da Promise de confirmação
let resolveConfirm

/**
 * Exibe um modal de alerta simples com um único botão "OK"
 * @param {string} title - Título do modal
 * @param {string} message - Mensagem de conteúdo
 * @param {string} type - Tipo de alerta: 'info' (padrão), 'success' ou 'error'
 */
function showModal(title, message, type = 'info') {
  modalTitle.textContent = title
  modalMessage.textContent = message

  // Remove classes de estilo anteriores e aplica nova
  modalContent.classList.remove('modal-success', 'modal-error')
  if (type === 'success') {
    modalContent.classList.add('modal-success')
  } else if (type === 'error') {
    modalContent.classList.add('modal-error')
  }

  // Configura botões: exibe apenas "OK"
  modalBtnConfirm.textContent = 'OK'
  modalBtnConfirm.style.display = 'block'
  modalBtnCancel.style.display = 'none'

  modal.classList.remove('hidden')

  // Fecha modal ao clicar em "OK"
  modalBtnConfirm.onclick = () => {
    modal.classList.add('hidden')
  }
  modalBtnCancel.onclick = null
}

/**
 * Exibe um modal de confirmação com botões "Confirmar" e "Cancelar"
 * Retorna uma Promise que resolve com true (confirmado) ou false (cancelado)
 * @param {string} title - Título da pergunta de confirmação
 * @param {string} message - Mensagem de confirmação
 * @returns {Promise<boolean>} - Resolve quando usuário clicar em um botão
 */
function showConfirm(title, message) {
  modalTitle.textContent = title
  modalMessage.textContent = message

  // Remove classes de tipo anterior
  modalContent.classList.remove('modal-success', 'modal-error')

  // Configura botões: exibe "Confirmar" e "Cancelar"
  modalBtnConfirm.textContent = 'Confirmar'
  modalBtnConfirm.style.display = 'block'
  modalBtnCancel.style.display = 'block'

  modal.classList.remove('hidden')

  // Retorna Promise que aguarda decisão do usuário
  return new Promise(resolve => {
    resolveConfirm = resolve
  })
}

// Configura listeners dos botões do modal
if (modal) {
  modalBtnConfirm.addEventListener('click', () => {
    modal.classList.add('hidden')
    if (resolveConfirm) {
      resolveConfirm(true) // Confirmado
      resolveConfirm = null
    }
  })

  modalBtnCancel.addEventListener('click', () => {
    modal.classList.add('hidden')
    if (resolveConfirm) {
      resolveConfirm(false) // Cancelado
      resolveConfirm = null
    }
  })
}

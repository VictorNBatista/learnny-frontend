/**
 * MÓDULO: Dashboard do Professor
 * ================================================
 * Gerencia a página principal do professor exibindo seus agendamentos,
 * permitindo confirmar, rejeitar ou cancelar aulas com alunos.
 */

document.addEventListener('DOMContentLoaded', function () {
  checkProfessorAuth()
  setupLogout()
})

/**
 * Verifica se o professor está autenticado
 * Redireciona para login se não houver token armazenado
 */
function checkProfessorAuth() {
  const professorToken = localStorage.getItem('professorToken')
  if (!professorToken) {
    window.location.href = 'login-professor.html'
    return
  }
  verifyProfessorToken(professorToken)
}

/**
 * Verifica validade do token com a API
 * Obtém dados do professor e inicializa a dashboard
 * @param {string} token - Token JWT armazenado do professor
 */
function verifyProfessorToken(token) {
  fetch(`${API_BASE_URL}/api/professor/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        localStorage.removeItem('professorToken')
        window.location.href = 'login-professor.html'
        throw new Error('Token inválido')
      }
      return response.json()
    })
    .then(professor => {
      // Personaliza mensagem de boas-vindas com nome do professor
      if (professor && professor.name) {
        const welcomeMessage = document.getElementById('welcome-message')
        if (welcomeMessage) {
          welcomeMessage.textContent = `Bem-vindo(a) de volta, ${professor.name}!`
        }
      }
      // Carrega os agendamentos e configura filtros
      loadAppointments(token, 'all')
      setupFilters()
    })
    .catch(error => {
      console.error('Erro de autenticação:', error)
      localStorage.removeItem('professorToken')
      localStorage.removeItem('professorId')
      window.location.href = 'login-professor.html'
    })
}

/**
 * Configura listeners para os botões de filtro de status
 * Permite filtrar agendamentos por: todos, pendentes, confirmados e cancelados
 */
function setupFilters() {
  const filterContainer = document.querySelector('.filter-buttons')
  if (!filterContainer) return

  filterContainer.addEventListener('click', event => {
    const targetButton = event.target.closest('.filter-btn')
    if (targetButton) {
      // Atualiza aparência do botão ativo
      filterContainer
        .querySelectorAll('.filter-btn')
        .forEach(btn => btn.classList.remove('active'))
      targetButton.classList.add('active')

      // Carrega agendamentos com novo filtro
      const filter = targetButton.dataset.filter
      const token = localStorage.getItem('professorToken')
      loadAppointments(token, filter)
    }
  })
}

/**
 * Carrega agendamentos do professor da API e exibe na dashboard
 * @param {string} token - Token JWT do professor
 * @param {string} filter - Filtro de status ('all', 'pending', 'confirmed', 'canceled')
 */
async function loadAppointments(token, filter = 'all') {
  const listContainer = document.getElementById('appointments-list')
  listContainer.innerHTML = '<p>Carregando agendamentos...</p>'

  // Monta URL da API com filtro de status
  let apiUrl = `${API_BASE_URL}/api/professor/appointments`

  if (filter !== 'all') {
    apiUrl += `?status=${filter}`
  }

  try {
    const response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!response.ok) throw new Error('Falha ao buscar agendamentos.')

    const appointments = await response.json()
    listContainer.innerHTML = ''

    // Verifica se há agendamentos para o filtro selecionado
    if (appointments.length === 0) {
      listContainer.innerHTML =
        '<p>Nenhum agendamento encontrado para este filtro.</p>'
      return
    }

    // Cria card para cada agendamento
    appointments.forEach(app => {
      const card = createAppointmentCard(app)
      listContainer.appendChild(card)
    })
  } catch (error) {
    console.error(error)
    listContainer.innerHTML =
      '<p>Ocorreu um erro ao carregar seus agendamentos.</p>'
  }
}

/**
 * Cria um card/cartão visual para um agendamento
 * Exibe informações do aluno, matéria, data/hora e ações disponíveis
 * @param {Object} app - Objeto agendamento com dados do aluno e aula
 * @returns {HTMLElement} - Elemento article contendo o card do agendamento
 */
function createAppointmentCard(app) {
  const card = document.createElement('article')
  card.className = 'appointment-card'
  const { user, subject } = app

  // Formata data e hora para o padrão brasileiro
  const dateTime = new Date(app.start_time)
  const date = dateTime.toLocaleDateString('pt-BR', { dateStyle: 'full' })
  const time = dateTime.toLocaleTimeString('pt-BR', { timeStyle: 'short' })

  // Define ações disponíveis conforme o status do agendamento
  let actionButtons = `<p>ID do agendamento: ${app.id}</p>`
  if (app.status === 'pending') {
    actionButtons = `
            <button class="reject-button" data-id="${app.id}">Rejeitar</button>
            <button class="confirm-button" data-id="${app.id}">Confirmar</button>
        `
  } else if (app.status === 'confirmed') {
    actionButtons = `<button class="cancel-button" data-id="${app.id}">Cancelar</button>`
  }

  // Monta HTML do card
  card.innerHTML = `
        <header>
            <div class="profile">
                <img src="${
                  user.photo_url || 'public/images/default-avatar.svg'
                }" alt="Foto de ${user.name}">
                <div>
                    <strong>Aluno: ${user.name}</strong>
                    <span>${subject.name}</span>
                </div>
            </div>
            <span class="status-badge status-${
              app.status
            }">${app.status.replace(/_/g, ' ')}</span>
        </header>
        <div class="details">
            <p><strong>Quando:</strong> ${date} às ${time}</p>
        </div>
        <footer class="action-footer">
            ${actionButtons}
        </footer>
    `

  // Atribui listeners aos botões de ação
  card
    .querySelector('.confirm-button')
    ?.addEventListener('click', handleConfirmClick)
  card
    .querySelector('.reject-button')
    ?.addEventListener('click', handleRejectClick)
  card
    .querySelector('.cancel-button')
    ?.addEventListener('click', handleProfessorCancelClick)

  return card
}

/**
 * Gerencia ações do professor sobre agendamentos (confirmar, rejeitar, cancelar)
 * Solicita confirmação do usuário antes de enviar requisição à API
 * @param {string} appointmentId - ID do agendamento
 * @param {string} action - Ação a realizar: 'confirm', 'reject' ou 'cancel'
 */
async function handleAppointmentAction(appointmentId, action) {
  const token = localStorage.getItem('professorToken')

  // Personaliza mensagens de confirmação conforme a ação
  let title = 'Confirmar Ação'
  let message = `Tem certeza que deseja ${action} o agendamento #${appointmentId}?`

  if (action === 'confirm') {
    title = 'Confirmar Agendamento'
    message = `Deseja confirmar a aula com o aluno para o agendamento #${appointmentId}?`
  } else if (action === 'reject') {
    title = 'Rejeitar Agendamento'
    message = `Deseja rejeitar esta solicitação de aula? (ID: ${appointmentId})`
  } else if (action === 'cancel') {
    title = 'Cancelar Agendamento'
    message = `Deseja cancelar esta aula confirmada? (ID: ${appointmentId})`
  }

  // Aguarda confirmação do usuário
  const didConfirm = await showConfirm(title, message)
  if (!didConfirm) return

  // Envia ação para API
  const url = `${API_BASE_URL}/api/professor/appointments/${appointmentId}/${action}`

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })

    if (response.ok) {
      showModal(
        'Sucesso!',
        `O agendamento #${appointmentId} foi atualizado com sucesso.`,
        'success'
      )
      loadAppointments(token) // Recarrega lista de agendamentos
    } else {
      const err = await response.json()
      showModal(
        'Erro',
        err.message || 'Não foi possível completar a ação.',
        'error'
      )
    }
  } catch (error) {
    console.error(`Erro ao tentar a ação '${action}':`, error)
    showModal(
      'Erro de Conexão',
      'Ocorreu um erro ao conectar com o servidor. Tente novamente.',
      'error'
    )
  }
}

/**
 * Configura listener para botão de logout
 */
function setupLogout() {
  const logoutBtn = document.getElementById('logout-button')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault()
      logout()
    })
  }
}

/**
 * Realiza logout do professor
 * Remove credenciais do navegador e redireciona para página inicial
 */
function logout() {
  const professorToken = localStorage.getItem('professorToken')
  if (professorToken) {
    fetch(`${API_BASE_URL}/api/professor/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${professorToken}` }
    }).finally(() => {
      // Remove credenciais independentemente da resposta da API
      localStorage.removeItem('professorToken')
      localStorage.removeItem('professorId')
      window.location.href = 'index.html'
    })
  } else {
    window.location.href = 'index.html'
  }
}

// Handlers para click nos botões de ação dos cards
function handleConfirmClick(e) {
  handleAppointmentAction(e.target.dataset.id, 'confirm')
}

function handleRejectClick(e) {
  handleAppointmentAction(e.target.dataset.id, 'reject')
}

function handleProfessorCancelClick(e) {
  handleAppointmentAction(e.target.dataset.id, 'cancel')
}

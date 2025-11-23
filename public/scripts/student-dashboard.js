/**
 * MÓDULO: Dashboard do Aluno
 * ================================================
 * Gerencia a página principal do aluno, exibindo seus agendamentos
 * com professores, permitindo filtrar e cancelar aulas.
 */

document.addEventListener('DOMContentLoaded', function () {
  // Inicializa dashboard do aluno
  checkStudentAuth()
  setupLogout()
})

/**
 * Verifica se o aluno está autenticado
 * Redireciona para login se não houver token
 */
function checkStudentAuth() {
  const userToken = localStorage.getItem('userToken')
  if (!userToken) {
    window.location.href = 'login-student.html'
    return
  }
  // Se token existe, valida com API e carrega dados
  verifyStudentToken(userToken)
}

/**
 * Valida token com a API e inicializa dados da dashboard
 * @param {string} token - Token JWT do aluno armazenado
 */
function verifyStudentToken(token) {
  // Valida token obtendo dados do usuário autenticado
  fetch(`${API_BASE_URL}/api/user/listar`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(response => {
      if (!response.ok) {
        localStorage.removeItem('userToken')
        window.location.href = 'login-student.html'
        throw new Error('Token inválido')
      }
      return response.json()
    })
    .then(user => {
      // Personaliza mensagem de boas-vindas
      if (user && user.name) {
        const welcomeMessage = document.getElementById('welcome-message')
        if (welcomeMessage) {
          welcomeMessage.textContent = `Bem-vindo(a) de volta, ${user.name}!`
        }
      }

      // Carrega agendamentos e configura filtros
      loadAppointments(token, 'all')
      setupFilters()
    })
    .catch(error => {
      console.error('Erro de autenticação:', error.message)
      localStorage.removeItem('userToken')
      window.location.href = 'login-student.html'
    })
}

/**
 * Configura listeners para botões de filtro de status de agendamentos
 * Permite filtrar por: todos, pendentes, confirmados e cancelados
 */
function setupFilters() {
  const filterContainer = document.querySelector('.filter-buttons')
  if (!filterContainer) return

  filterContainer.addEventListener('click', event => {
    const targetButton = event.target.closest('.filter-btn')
    if (targetButton) {
      // Atualiza botão ativo
      filterContainer
        .querySelectorAll('.filter-btn')
        .forEach(btn => btn.classList.remove('active'))
      targetButton.classList.add('active')

      // Carrega agendamentos com novo filtro
      const filter = targetButton.dataset.filter
      const token = localStorage.getItem('userToken')
      loadAppointments(token, filter)
    }
  })
}

/**
 * Carrega agendamentos do aluno da API e exibe na dashboard
 * @param {string} token - Token JWT do aluno
 * @param {string} filter - Filtro de status ('all', 'pending', 'confirmed', 'canceled')
 */
async function loadAppointments(token, filter = 'all') {
  const listContainer = document.getElementById('appointments-list')
  listContainer.innerHTML = '<p>Carregando seus agendamentos...</p>'

  // Monta URL com filtro de status
  let apiUrl = `${API_BASE_URL}/api/appointments/my`

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
 * Cria card visual de um agendamento
 * Exibe dados do professor, matéria, data/hora e ação de cancelamento
 * @param {Object} app - Dados do agendamento
 * @returns {HTMLElement} - Elemento article com o card
 */
function createAppointmentCard(app) {
  const card = document.createElement('article')
  card.className = 'appointment-card'
  const { professor, subject } = app

  // Formata data e hora para padrão brasileiro
  const dateTime = new Date(app.start_time)
  const date = dateTime.toLocaleDateString('pt-BR', { dateStyle: 'full' })
  const time = dateTime.toLocaleTimeString('pt-BR', { timeStyle: 'short' })

  // Botão de cancelamento só aparece para agendamentos pendentes/confirmados
  const cancelButton =
    app.status === 'pending' || app.status === 'confirmed'
      ? `<button class="cancel-button" data-id="${app.id}">Cancelar</button>`
      : `<p>ID do agendamento: ${app.id}</p>`

  card.innerHTML = `
        <header>
            <div class="profile">
                <img src="${professor.photo_url || ''}" alt="Foto de ${
    professor.name
  }">
                <div>
                    <strong>${professor.name}</strong>
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
        <footer>
            ${cancelButton}
        </footer>
    `

  // Atribui listener ao botão de cancelamento
  const btnCancel = card.querySelector('.cancel-button')
  if (btnCancel) {
    btnCancel.addEventListener('click', handleCancelClick)
  }
  return card
}

/**
 * Manipula solicitação de cancelamento de agendamento
 * Solicita confirmação e envia requisição à API
 * @param {Event} event - Evento do click do botão cancelar
 */
async function handleCancelClick(event) {
  const appointmentId = event.target.dataset.id

  // Solicita confirmação do usuário
  const title = 'Confirmar Ação'
  const message = `Tem certeza que deseja cancelar o agendamento #${appointmentId}?`

  const token = localStorage.getItem('userToken')
  const cancelUrl = `${API_BASE_URL}/api/appointments/${appointmentId}/cancel`

  const didConfirm = await showConfirm(title, message)
  if (!didConfirm) return

  try {
    // Envia solicitação de cancelamento
    const response = await fetch(cancelUrl, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })

    if (response.ok) {
      showModal(
        'Sucesso!',
        `O agendamento #${appointmentId} foi cancelado com sucesso.`,
        'success'
      )
      loadAppointments(token) // Recarrega lista
    } else {
      const errorData = await response.json()
      alert(`Erro ao cancelar: ${errorData.message}`)
    }
  } catch (error) {
    console.error('Erro ao cancelar:', error)
    alert('Ocorreu um erro de conexão ao tentar cancelar.')
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
 * Realiza logout do aluno
 * Remove credenciais do navegador e redireciona para página inicial
 */
function logout() {
  const userToken = localStorage.getItem('userToken')
  if (userToken) {
    fetch(`${API_BASE_URL}/api/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    }).finally(() => {
      // Remove credenciais independentemente da resposta da API
      localStorage.removeItem('userToken')
      localStorage.removeItem('userId')
      window.location.href = 'index.html'
    })
  } else {
    window.location.href = 'index.html'
  }
}

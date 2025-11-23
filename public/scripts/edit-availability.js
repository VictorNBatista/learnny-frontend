/**
 * MÓDULO: Edição de Disponibilidade
 * ================================================
 * Gerencia a configuração de horários disponíveis do professor.
 * Permite selecionar dias da semana e horários de aula.
 */

document.addEventListener('DOMContentLoaded', () => {
  initAvailabilityPage()
})

// Nomes dos dias da semana em português
const weekDays = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
]

/**
 * Inicializa a página de disponibilidade
 * Verifica autenticação, cria formulário e carrega dados
 */
async function initAvailabilityPage() {
  const token = localStorage.getItem('professorToken')
  if (!token) {
    showModal('Erro', 'Você precisa estar logado como professor.', 'error')
    setTimeout(() => (window.location.href = 'login-professor.html'), 2000)
    return
  }

  const scheduleContainer = document.getElementById('availability-schedule')
  const form = document.getElementById('availability-form')

  // Cria estrutura HTML para os 7 dias da semana
  scheduleContainer.innerHTML = ''
  weekDays.forEach((dayName, index) => {
    const item = document.createElement('div')
    item.className = 'availability-item'
    item.innerHTML = `
            <label class="day-label" for="day-${index}-active">
                <input type="checkbox" id="day-${index}-active" data-day="${index}">
                ${dayName}
            </label>
            <input type="time" class="time-input start-time" id="day-${index}-start" data-day="${index}" step="1800" disabled>
            <input type="time" class="time-input end-time" id="day-${index}-end" data-day="${index}" step="1800" disabled>
        `
    scheduleContainer.appendChild(item)
  })

  // Busca disponibilidade atual e preenche o formulário
  try {
    const currentAvailability = await fetchAvailability(token)
    populateForm(currentAvailability)
  } catch (error) {
    showModal('Erro ao Carregar', error.message, 'error')
  }

  // Configura listeners para interações do usuário
  setupEventListeners(token)
}

/**
 * Busca disponibilidade atual do professor
 * @param {string} token - Token JWT de autenticação
 * @returns {Promise<Array>} - Array de disponibilidades
 */
async function fetchAvailability(token) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/professor/availabilities`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    if (!response.ok) {
      if (response.status === 401)
        throw new Error('Sessão expirada. Faça login novamente.')
      throw new Error('Não foi possível buscar sua disponibilidade.')
    }
    const data = await response.json()
    // Garante que retorna um array
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error('Erro em fetchAvailability:', error)
    // Redireciona se sessão expirada
    if (error.message.includes('Sessão expirada')) {
      setTimeout(() => (window.location.href = 'login-professor.html'), 2000)
    }
    throw error
  }
}

/**
 * Preenche o formulário com dados de disponibilidade
 * @param {Array} availabilityData - Array com dados de disponibilidade
 */
function populateForm(availabilityData) {
  if (!Array.isArray(availabilityData)) {
    console.error('Erro: Os dados recebidos não são um array!')
    return
  }

  // Popula cada dia com seus horários
  availabilityData.forEach(item => {
    const dayIndex = item.day_of_week

    const checkbox = document.getElementById(`day-${dayIndex}-active`)
    const startTimeInput = document.getElementById(`day-${dayIndex}-start`)
    const endTimeInput = document.getElementById(`day-${dayIndex}-end`)

    if (checkbox && startTimeInput && endTimeInput) {
      checkbox.checked = true
      // Extrai apenas HH:MM do formato completo
      startTimeInput.value = item.start_time
        ? item.start_time.substring(0, 5)
        : ''
      endTimeInput.value = item.end_time ? item.end_time.substring(0, 5) : ''
      startTimeInput.disabled = false
      endTimeInput.disabled = false
    } else {
      console.warn(`Elementos não encontrados para o dia ${dayIndex}`)
    }
  })
}

/**
 * Configura listeners para interações de formulário
 * Habilita/desabilita campos baseado em checkboxes
 * @param {string} token - Token JWT para requisições
 */
function setupEventListeners(token) {
  const scheduleContainer = document.getElementById('availability-schedule')
  const form = document.getElementById('availability-form')

  // Habilita/desabilita campos de hora conforme checkbox é marcado
  scheduleContainer.addEventListener('change', event => {
    if (event.target.type === 'checkbox') {
      const dayIndex = event.target.dataset.day
      const isChecked = event.target.checked
      const startTimeInput = document.getElementById(`day-${dayIndex}-start`)
      const endTimeInput = document.getElementById(`day-${dayIndex}-end`)

      startTimeInput.disabled = !isChecked
      endTimeInput.disabled = !isChecked

      // Limpa valores se dia é desmarcado
      if (!isChecked) {
        startTimeInput.value = ''
        endTimeInput.value = ''
      }
    }
  })

  // Processa submissão do formulário
  form.addEventListener('submit', async event => {
    event.preventDefault()
    const saveButton = form.querySelector('button[type="submit"]')
    saveButton.disabled = true
    saveButton.textContent = 'Salvando...'

    const payload = []
    let validationError = false

    // Coleta dados de dias marcados
    for (let i = 0; i < 7; i++) {
      const checkbox = document.getElementById(`day-${i}-active`)
      if (checkbox.checked) {
        const startTime = document.getElementById(`day-${i}-start`).value
        const endTime = document.getElementById(`day-${i}-end`).value

        // Valida se horários estão preenchidos
        if (!startTime || !endTime) {
          showModal(
            'Erro de Validação',
            `Por favor, preencha os horários de início e fim para ${weekDays[i]}.`,
            'error'
          )
          validationError = true
          break
        }

        // Valida se início é anterior ao fim
        if (startTime >= endTime) {
          showModal(
            'Erro de Validação',
            `O horário de início deve ser anterior ao horário de fim para ${weekDays[i]}.`,
            'error'
          )
          validationError = true
          break
        }

        payload.push({
          day_of_week: i,
          start_time: startTime,
          end_time: endTime
        })
      }
    }

    if (validationError) {
      saveButton.disabled = false
      saveButton.textContent = 'Salvar alterações'
      return
    }

    // Envia disponibilidades para API
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/professor/availabilities`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ availabilities: payload })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao salvar disponibilidade.')
      }

      showModal(
        'Sucesso!',
        'Sua disponibilidade foi atualizada com sucesso!',
        'success'
      )
    } catch (error) {
      showModal('Erro ao Salvar', error.message, 'error')
    } finally {
      // Reabilita botão após operação
      saveButton.disabled = false
      saveButton.textContent = 'Salvar alterações'
    }
  })
}

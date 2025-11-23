/**
 * MÓDULO: Agendamento de Aulas
 * ================================================
 * Gerencia o fluxo de agendamento de aulas com professor.
 * Carrega detalhes do professor, horários disponíveis e processa agendamento.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const professorInfoContainer = document.getElementById('professor-info')
  const subjectSelect = document.getElementById('subject-select')
  const slotsContainer = document.getElementById('slots-container')
  const token = localStorage.getItem('userToken')

  // Extrai ID do professor da URL via query parameter
  const params = new URLSearchParams(window.location.search)
  const professorId = params.get('professorId')

  if (!professorId) {
    showModal(
      'Erro',
      'Professor não especificado. Você será redirecionado.',
      'error'
    )
    setTimeout(() => {
      window.location.href = 'study.html'
    }, 2500)
    return
  }

  /**
   * Busca dados do professor e popula seletor de matérias
   * Carrega imagem, nome e lista de matérias disponíveis
   */
  async function loadProfessorDetails() {
    try {
      // Busca detalhes do professor incluindo suas matérias
      const response = await fetch(
        `${API_BASE_URL}/api/user/professors/${professorId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (!response.ok) {
        console.error('Erro ao buscar detalhes do professor:', response.status)
        showModal(
          'Erro ao Carregar',
          'Não foi possível carregar os detalhes do professor.',
          'error'
        )
        return
      }

      const responseData = await response.json()
      const professor = responseData.data

      if (!professor) {
        throw new Error(
          'Dados do professor não encontrados na resposta da API.'
        )
      }

      console.log('Detalhes do professor:', professor)

      // Exibe foto e nome do professor
      professorInfoContainer.innerHTML = `
              <img src="${
                professor.photo_url || 'public/images/default-avatar.svg'
              }" alt="${professor.name}">
              <strong>${professor.name}</strong>
          `

      // Popula select com matérias do professor
      subjectSelect.innerHTML =
        '<option value="" disabled selected>Selecione uma matéria</option>'
      if (professor.subjects && professor.subjects.length > 0) {
        professor.subjects.forEach(subject => {
          const option = document.createElement('option')
          option.value = subject.id
          option.textContent = subject.name
          subjectSelect.appendChild(option)
        })
      } else {
        // Informa se professor não tem matérias cadastradas
        const option = document.createElement('option')
        option.value = ''
        option.textContent = 'Nenhuma matéria disponível'
        option.disabled = true
        subjectSelect.appendChild(option)
      }
    } catch (error) {
      console.error('Falha na requisição de detalhes do professor:', error)
      showModal(
        'Erro de Conexão',
        'Ocorreu um erro ao buscar os detalhes do professor. Tente recarregar a página.',
        'error'
      )
    }
  }

  /**
   * Busca e exibe horários disponíveis do professor
   * Formata datas/horas para locale pt-BR
   */
  async function loadAvailableSlots() {
    slotsContainer.innerHTML = '<p>Carregando horários...</p>'
    try {
      // Busca array de slots ISO 8601 do professor
      const response = await fetch(
        `${API_BASE_URL}/api/professor/${professorId}/availabilities`
      )
      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao buscar horários.`)
      }
      const slots = await response.json()

      slotsContainer.innerHTML = ''
      if (!Array.isArray(slots) || slots.length === 0) {
        slotsContainer.innerHTML =
          '<p>Nenhum horário disponível para os próximos 7 dias.</p>'
        return
      }

      // Cria botão para cada slot disponível
      slots.forEach(slot => {
        const date = new Date(slot)

        // Valida se data é válida
        if (isNaN(date.getTime())) {
          console.warn('Slot inválido recebido:', slot)
          return
        }

        // Formata data no padrão brasileiro
        const formattedDate = date.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit'
        })

        // Formata hora no padrão brasileiro
        const formattedTime = date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })

        const slotButton = document.createElement('button')
        slotButton.className = 'slot-button'
        slotButton.textContent = `${formattedDate} às ${formattedTime}`
        slotButton.dataset.startTime = slot

        slotButton.addEventListener('click', handleSlotClick)
        slotsContainer.appendChild(slotButton)
      })
    } catch (error) {
      console.error('Erro ao carregar slots:', error)
      showModal(
        'Erro',
        'Não foi possível carregar os horários disponíveis.',
        'error'
      )
    }
  }

  /**
   * Processa clique em um horário disponível
   * Valida matéria selecionada e pede confirmação do usuário
   * @param {Event} event - Evento do clique no botão de slot
   */
  async function handleSlotClick(event) {
    const selectedSubjectId = subjectSelect.value
    if (!selectedSubjectId) {
      showModal('Atenção', 'Por favor, selecione uma matéria primeiro.', 'info')
      return
    }

    const startTime = event.target.dataset.startTime
    const selectedSubjectText =
      subjectSelect.options[subjectSelect.selectedIndex].text
    const selectedTimeText = event.target.textContent

    // Solicita confirmação do usuário
    const didConfirm = await showConfirm(
      'Confirmar Agendamento',
      `Deseja realmente agendar uma aula de ${selectedSubjectText} para ${selectedTimeText}?`
    )

    if (didConfirm) {
      bookAppointment(startTime, selectedSubjectId)
    }
  }

  /**
   * Envia requisição de agendamento para API
   * Cria novo agendamento e redireciona ao dashboard em caso de sucesso
   * @param {string} startTime - Horário ISO 8601 do agendamento
   * @param {number} subjectId - ID da matéria selecionada
   */
  async function bookAppointment(startTime, subjectId) {
    try {
      // Envia dados de agendamento para API
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          professor_id: professorId,
          subject_id: subjectId,
          start_time: startTime
        })
      })

      if (response.status === 201) {
        showModal(
          'Agendamento Solicitado!',
          'Sua solicitação foi enviada com sucesso! O professor irá confirmar em breve.',
          'success'
        )
        setTimeout(() => {
          window.location.href = 'dashboard-student.html'
        }, 3000)
      } else {
        const errorData = await response.json().catch(() => ({
          message: 'Erro desconhecido ao processar a resposta.'
        }))
        showModal(
          'Erro ao Agendar',
          errorData.message ||
            `Ocorreu um erro (${response.status}). Tente outro horário.`,
          'error'
        )
      }
    } catch (error) {
      console.error('Erro na requisição de agendamento:', error)
      showModal(
        'Erro de Conexão',
        'Não foi possível conectar ao servidor para agendar a aula. Tente novamente.',
        'error'
      )
    }
  }

  // Carrega dados em sequência ao iniciar
  // Primeiro carrega professor, depois horários só se professor carregou com sucesso
  await loadProfessorDetails()
  if (document.getElementById('professor-info').innerHTML !== '') {
    await loadAvailableSlots()
  }
})

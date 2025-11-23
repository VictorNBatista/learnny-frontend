/**
 * MÓDULO: Edição de Perfil de Professor
 * ================================================
 * Gerencia a edição de informações pessoais e profissionais do professor.
 * Permite atualizar nome, contato, foto, biografia, preço e matérias.
 */

document.addEventListener('DOMContentLoaded', () => {
  initProfessorProfilePage()
})


/**
 * Inicializa página de edição de perfil do professor
 * Valida autenticação, carrega dados e configura formulário
 */
async function initProfessorProfilePage() {
  const token = localStorage.getItem('professorToken')
  const professorId = localStorage.getItem('professorId')

  if (!token || !professorId) {
    showModal(
      'Sessão Inválida',
      'Você precisa estar logado como professor para acessar esta página. Redirecionando...',
      'error'
    )
    setTimeout(() => redirectProfessorToLogin(), 2500)
    return
  }

  const form = document.getElementById('professor-profile-form')

  let initialData = null
  let availableSubjects = []

  try {
    // Carrega dados em paralelo: matérias disponíveis e perfil do professor
    const [subjects, profile] = await Promise.all([
      fetchSubjects(),
      fetchProfessorProfile(token)
    ])

    availableSubjects = subjects
    initialData = normalizeProfessorProfile(profile)

    populateProfessorForm(initialData, availableSubjects)
  } catch (error) {
    console.error('Erro ao carregar dados do professor:', error)
    showModal(
      'Erro ao Carregar',
      error.message || 'Não foi possível carregar suas informações.',
      'error'
    )
    return
  }

  // Processa submissão do formulário
  form.addEventListener('submit', async event => {
    event.preventDefault()

    // Constrói objeto com apenas os dados alterados
    const payload = buildProfessorPayload(initialData)
    if (Object.keys(payload).length === 0) {
      showModal(
        'Nenhuma Alteração',
        'Nenhuma alteração foi detectada no seu perfil.',
        'info'
      )
      return
    }

    try {
      // Envia alterações para API
      const response = await fetch(
        `${API_BASE_URL}/api/professor/atualizar/${professorId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      )

      const data = await response.json().catch(() => ({}))

      // Trata sessão expirada
      if (response.status === 401) {
        showModal(
          'Sessão Expirada',
          'Sua sessão expirou. Faça login novamente.',
          'error'
        )
        setTimeout(() => redirectProfessorToLogin(true), 2500)
        return
      }

      if (!response.ok) {
        // Extrai mensagem de erro (prioriza erros de validação do Laravel)
        let errorMessage = data.message || 'Erro ao salvar alterações.'
        if (data.errors) {
          const firstErrorKey = Object.keys(data.errors)[0]
          errorMessage = data.errors[firstErrorKey][0]
        }
        throw new Error(errorMessage)
      }

      // Atualiza dados iniciais após sucesso
      const updatedSubjects =
        payload.subjects !== undefined
          ? [...payload.subjects]
          : initialData.subjects

      initialData = {
        ...initialData,
        ...payload,
        subjects: updatedSubjects
      }

      if ('photo_url' in payload && !payload.photo_url) {
        initialData.photo_url = ''
      }

      showModal('Sucesso!', 'Seu perfil foi atualizado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      showModal(
        'Erro ao Salvar',
        error.message || 'Não foi possível atualizar o perfil.',
        'error'
      )
    }
  })
}


/**
 * Redireciona professor para página de login
 * @param {boolean} clearStorage - Se true, limpa tokens do localStorage
 */
function redirectProfessorToLogin(clearStorage = false) {
  if (clearStorage) {
    localStorage.removeItem('professorToken')
    localStorage.removeItem('professorId')
  }
  window.location.href = 'login-professor.html'
}

/**
 * Busca dados do perfil do professor da API
 * @param {string} token - Token JWT de autenticação
 * @returns {Promise<Object>} - Dados do professor
 */
async function fetchProfessorProfile(token) {
  const response = await fetch(`${API_BASE_URL}/api/professor/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const payload = await response.json().catch(() => ({}))

  if (response.status === 401) {
    redirectProfessorToLogin(true)
    throw new Error('Sessão expirada.')
  }

  if (!response.ok || !payload?.data) {
    throw new Error(
      payload.message || 'Não foi possível obter os dados do professor.'
    )
  }

  return payload.data
}

/**
 * Busca lista de matérias disponíveis da API
 * @returns {Promise<Array>} - Array de matérias
 */
async function fetchSubjects() {
  const response = await fetch(`${API_BASE_URL}/api/subject/listar`)
  if (!response.ok) {
    throw new Error('Não foi possível carregar as matérias disponíveis.')
  }
  const result = await response.json()
  return Array.isArray(result) ? result : result.data || []
}

/**
 * Normaliza dados do professor para formato esperado pelo formulário
 * @param {Object} profile - Dados do professor da API
 * @returns {Object} - Dados normalizados
 */
function normalizeProfessorProfile(profile) {
  // Extrai IDs de matérias
  const subjectIds = Array.isArray(profile.subjects)
    ? profile.subjects.map(subject => subject.id)
    : []

  return {
    name: profile.name || '',
    email: profile.email || '',
    contact: profile.contact || '',
    photo_url: profile.photo_url || '',
    biography: profile.biography || '',
    price:
      profile.price !== null && profile.price !== undefined
        ? Number(profile.price)
        : '',
    subjects: subjectIds
  }
}

/**
 * Popula formulário com dados do professor
 * @param {Object} initialData - Dados iniciais do professor
 * @param {Array} subjectsList - Lista de matérias disponíveis
 */
function populateProfessorForm(initialData, subjectsList) {
  document.getElementById('name').value = initialData.name
  document.getElementById('email').value = initialData.email
  document.getElementById('contact').value = initialData.contact
  document.getElementById('photo_url').value = initialData.photo_url
  document.getElementById('biography').value = initialData.biography
  document.getElementById('price').value =
    initialData.price === '' ? '' : initialData.price

  renderSubjects(subjectsList, initialData.subjects)
}
/**
 * Renderiza checkboxes de matérias no formulário
 * @param {Array} subjects - Lista de matérias disponíveis
 * @param {Array} selectedIds - IDs das matérias atualmente selecionadas
 */
function renderSubjects(subjects, selectedIds) {
  const container = document.getElementById('subjects-checkbox-list')
  container.innerHTML = ''

  if (!Array.isArray(subjects) || subjects.length === 0) {
    container.innerHTML = '<p>Nenhuma matéria cadastrada no sistema.</p>'
    return
  }

  subjects.forEach(subject => {
    const wrapper = document.createElement('label')
    wrapper.classList.add('subject-item')
    wrapper.setAttribute('for', `subject-${subject.id}`)

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.name = 'subjects[]'
    checkbox.value = subject.id
    checkbox.id = `subject-${subject.id}`
    checkbox.checked =
      Array.isArray(selectedIds) && selectedIds.includes(subject.id)

    const text = document.createElement('span')
    text.textContent = subject.name

    wrapper.appendChild(checkbox)
    wrapper.appendChild(text)
    container.appendChild(wrapper)
  })
}

/**
 * Constrói objeto com apenas os dados alterados
 * @param {Object} initialData - Dados originais do professor
 * @returns {Object} - Objeto com apenas campos modificados
 */
function buildProfessorPayload(initialData) {
  const payload = {}

  const name = document.getElementById('name').value.trim()
  if (name && name !== initialData.name) {
    payload.name = name
  }

  const contact = document.getElementById('contact').value.trim()
  if (contact && contact !== initialData.contact) {
    payload.contact = contact
  }

  const photoUrl = document.getElementById('photo_url').value.trim()
  if (photoUrl !== initialData.photo_url) {
    payload.photo_url = photoUrl === '' ? null : photoUrl
  }

  const biography = document.getElementById('biography').value.trim()
  if (biography !== initialData.biography) {
    payload.biography = biography
  }

  const priceField = document.getElementById('price').value.trim()
  if (priceField !== '') {
    const parsedPrice = Number(priceField)
    if (
      !Number.isNaN(parsedPrice) &&
      parsedPrice >= 0 &&
      parsedPrice !== initialData.price
    ) {
      payload.price = parsedPrice
    }
  }

  // Coleta matérias selecionadas
  const selectedSubjects = Array.from(
    document.querySelectorAll('input[name="subjects[]"]:checked')
  ).map(checkbox => Number(checkbox.value))

  // Envia apenas se houver mudança
  if (!arraysEqual(selectedSubjects, initialData.subjects)) {
    payload.subjects = selectedSubjects
  }

  return payload
}

/**
 * Compara dois arrays de números de forma independente de ordem
 * @param {Array} arrayA - Primeiro array
 * @param {Array} arrayB - Segundo array
 * @returns {boolean} - True se conteúdos são iguais
 */
function arraysEqual(arrayA = [], arrayB = []) {
  const arrA = Array.isArray(arrayA) ? arrayA : []
  const arrB = Array.isArray(arrayB) ? arrayB : []

  if (arrA.length !== arrB.length) return false
  const sortedA = [...arrA].sort((a, b) => a - b)
  const sortedB = [...arrB].sort((a, b) => a - b)
  return sortedA.every((value, index) => value === sortedB[index])
}

/**
 * MÓDULO: Edição de Perfil de Aluno
 * ================================================
 * Gerencia a edição de informações do aluno.
 * Permite atualizar nome, email, contato, foto e senha.
 */

document.addEventListener('DOMContentLoaded', () => {
  initStudentProfilePage()
})

/**
 * Inicializa página de edição de perfil do aluno
 * Valida autenticação, carrega dados e configura formulário
 */
async function initStudentProfilePage() {
  const token = localStorage.getItem('userToken')
  const userId = localStorage.getItem('userId')

  if (!token || !userId) {
    showModal(
      'Sessão Inválida',
      'Você precisa estar logado para acessar esta página. Redirecionando...',
      'error'
    )
    setTimeout(() => redirectStudentToLogin(), 2500)
    return
  }

  const form = document.getElementById('student-profile-form')

  let initialData = null

  try {
    // Carrega dados do perfil do aluno
    const profile = await fetchStudentProfile(token, userId)
    initialData = normalizeStudentProfile(profile)
    populateStudentForm(initialData)
  } catch (error) {
    console.error('Erro ao carregar perfil do aluno:', error)
    showModal(
      'Erro ao Carregar',
      error.message || 'Não foi possível carregar seus dados.',
      'error'
    )
    return
  }

  // Processa submissão do formulário
  form.addEventListener('submit', async event => {
    event.preventDefault()

    // Constrói payload com dados alterados e valida
    const { payload, validationError } = buildStudentPayload(initialData)

    if (validationError) {
      showModal('Erro de Validação', validationError, 'error')
      return
    }

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
        `${API_BASE_URL}/api/user/atualizar/${userId}`,
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
        setTimeout(() => redirectStudentToLogin(true), 2500)
        return
      }

      if (!response.ok) {
        // Extrai mensagem de erro (prioriza erros de validação do Laravel)
        let errorMessage = data.message || 'Erro ao atualizar o perfil.'
        if (data.errors) {
          const firstErrorKey = Object.keys(data.errors)[0]
          errorMessage = data.errors[firstErrorKey][0]
        }
        throw new Error(errorMessage)
      }

      // Atualiza dados iniciais apenas com campos persistentes
      initialData = {
        ...initialData,
        ...filterPersistedStudentData(payload)
      }

      clearStudentPasswordFields()
      showModal('Sucesso!', 'Seu perfil foi atualizado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao salvar perfil do aluno:', error)
      showModal(
        'Erro ao Salvar',
        error.message || 'Não foi possível atualizar o perfil.',
        'error'
      )
    }
  })
}

/**
 * Redireciona aluno para página de login
 * @param {boolean} clear - Se true, limpa tokens do localStorage
 */
function redirectStudentToLogin(clear = false) {
  if (clear) {
    localStorage.removeItem('userToken')
    localStorage.removeItem('userId')
  }
  window.location.href = 'login-student.html'
}

/**
 * Busca dados do perfil do aluno da API
 * @param {string} token - Token JWT de autenticação
 * @param {string} userId - ID do aluno
 * @returns {Promise<Object>} - Dados do aluno
 */
async function fetchStudentProfile(token, userId) {
  const response = await fetch(
    `${API_BASE_URL}/api/user/visualizar/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  const payload = await response.json().catch(() => ({}))

  if (response.status === 401) {
    redirectStudentToLogin(true)
    throw new Error('Sessão expirada.')
  }

  // Extrai dados do aluno da resposta
  const userProfile = payload.user || payload.data || payload

  if (!response.ok || !userProfile) {
    throw new Error(
      payload.message || 'Não foi possível obter as informações do aluno.'
    )
  }

  return userProfile
}

/**
 * Normaliza dados do aluno para formato esperado pelo formulário
 * @param {Object} profile - Dados do aluno da API
 * @returns {Object} - Dados normalizados
 */
function normalizeStudentProfile(profile) {
  return {
    name: profile.name || '',
    email: (profile.email || '').toLowerCase(),
    contact: profile.contact || '',
    photo_url: profile.photo_url || ''
  }
}

/**
 * Popula formulário com dados do aluno
 * @param {Object} initialData - Dados iniciais do aluno
 */
function populateStudentForm(initialData) {
  document.getElementById('name').value = initialData.name
  document.getElementById('email').value = initialData.email
  document.getElementById('contact').value = initialData.contact
  document.getElementById('photo_url').value = initialData.photo_url
  clearStudentPasswordFields()
}

/**
 * Constrói payload com dados alterados, validando senha se fornecida
 * @param {Object} initialData - Dados originais do aluno
 * @returns {Object} - Objeto {payload, validationError}
 */
function buildStudentPayload(initialData) {
  const payload = {}
  let validationError = null

  const name = document.getElementById('name').value.trim()
  const email = document.getElementById('email').value.trim().toLowerCase()
  const contact = document.getElementById('contact').value.trim()
  const photo_url = document.getElementById('photo_url').value.trim()
  const password = document.getElementById('password').value
  const passwordConfirmation = document.getElementById(
    'password_confirmation'
  ).value

  // Adiciona ao payload apenas se houver mudança
  if (name && name !== initialData.name) {
    payload.name = name
  }
  if (email && email !== initialData.email) {
    payload.email = email
  }
  if (contact && contact !== initialData.contact) {
    payload.contact = contact
  }
  if (photo_url !== initialData.photo_url) {
    payload.photo_url = photo_url === '' ? null : photo_url
  }

  // Processa alteração de senha se fornecida
  if (password || passwordConfirmation) {
    if (!password || !passwordConfirmation) {
      validationError = 'Preencha e confirme a nova senha para atualizá-la.'
    } else if (password !== passwordConfirmation) {
      validationError = 'As senhas informadas não conferem.'
    } else {
      // Valida requisitos de segurança: mínimo 8 caracteres, maiúscula, minúscula, número, símbolo
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      if (!passwordRegex.test(password)) {
        validationError =
          'A nova senha não atende aos requisitos de segurança (mínimo 8 caracteres, maiúscula, minúscula, número, símbolo).'
      } else {
        payload.password = password
        payload.password_confirmation = passwordConfirmation
      }
    }
  }

  return { payload, validationError }
}

/**
 * Filtra dados removendo campos de senha (não persistem no initialData)
 * @param {Object} payload - Payload original
 * @returns {Object} - Payload sem campos de senha
 */
function filterPersistedStudentData(payload) {
  const { password, password_confirmation, ...rest } = payload
  return rest
}

/**
 * Limpa campos de senha do formulário após salvar
 */
function clearStudentPasswordFields() {
  document.getElementById('password').value = ''
  document.getElementById('password_confirmation').value = ''
}

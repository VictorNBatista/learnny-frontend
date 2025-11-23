/**
 * MÓDULO: Registro de Professor
 * ================================================
 * Gerencia o formulário de cadastro de professores.
 * Carrega lista de matérias, valida dados e envia registro para API.
 */

document.addEventListener('DOMContentLoaded', () => {
  carregarMaterias()

  document
    .getElementById('create-class')
    .addEventListener('submit', cadastrarProfessor)
})

/**
 * Carrega as matérias disponíveis da API e popula checkboxes no formulário
 * Exibe feedback visual durante carregamento e em caso de erro
 */
async function carregarMaterias() {
  const container = document.getElementById('subjects-checkbox-list')
  container.innerHTML = '<p>Carregando matérias...</p>'

  try {
    // Busca lista de matérias da API
    const resposta = await fetch(`${API_BASE_URL}/api/subject/listar`)
    if (!resposta.ok) throw new Error('Erro ao carregar matérias')

    const materias = await resposta.json()
    console.log('Matérias carregadas:', materias)
    container.innerHTML = ''

    if (!Array.isArray(materias) || materias.length === 0) {
      container.innerHTML = '<p>Nenhuma matéria encontrada.</p>'
      return
    }

    // Cria checkbox para cada matéria
    materias.forEach(subject => {
      const wrapper = document.createElement('div')
      wrapper.classList.add('subject-item')

      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.name = 'subjects[]'
      checkbox.value = subject.id
      checkbox.id = `subject-${subject.id}`

      const label = document.createElement('label')
      label.htmlFor = checkbox.id
      label.textContent = subject.name

      wrapper.appendChild(checkbox)
      wrapper.appendChild(label)
      container.appendChild(wrapper)
    })
  } catch (erro) {
    console.error('Erro ao carregar matérias:', erro)
    container.innerHTML = '<p>Erro ao carregar matérias.</p>'
    
    showModal(
      'Erro',
      'Não foi possível carregar a lista de matérias disponíveis.',
      'error'
    )
  }
}

/**
 * Processa o cadastro de novo professor
 * Valida dados, coleta matérias selecionadas e envia para API
 * @param {Event} event - Evento de submit do formulário
 */
async function cadastrarProfessor(event) {
  event.preventDefault()

  // Coleta dados do formulário
  const name = document.getElementById('name').value
  const username = document.getElementById('username').value
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const password_confirmation = document.getElementById(
    'password_confirmation'
  ).value
  const photo_url = document.getElementById('avatar').value
  const contact = document.getElementById('whatsapp').value
  const biography = document.getElementById('bio').value
  const price = parseFloat(document.getElementById('cost').value)

  // Coleta IDs das matérias selecionadas via checkboxes
  const subjects = Array.from(
    document.querySelectorAll('input[name="subjects[]"]:checked')
  ).map(cb => parseInt(cb.value))

  // Valida se as senhas coincidem
  if (password !== password_confirmation) {
    showModal(
      'Erro de Validação',
      'As senhas digitadas não coincidem.',
      'error'
    )
    return
  }

  // Valida se pelo menos uma matéria foi selecionada
  if (subjects.length === 0) {
    showModal('Erro de Validação', 'Selecione pelo menos uma matéria.', 'error')
    return
  }

  // Monta objeto com dados do professor
  const dados = {
    name,
    username,
    email,
    password,
    password_confirmation,
    photo_url,
    contact,
    biography,
    price,
    subjects
  }

  console.log('Dados a serem enviados:', dados)

  try {
    // Envia dados para API de cadastro de professores
    const resposta = await fetch(`${API_BASE_URL}/api/professor/cadastrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(dados)
    })

    // Tenta processar resposta JSON, trata erro se resposta não for JSON válido
    const respostaJson = await resposta.json().catch(() => ({}))

    if (resposta.ok) {
      showModal(
        'Cadastro Realizado!',
        `Professor ${dados.name} cadastrado com sucesso! Você será redirecionado para a página de login.`,
        'success'
      )
      document.getElementById('create-class').reset()

      // Aguarda 3 segundos para o usuário ler mensagem de sucesso antes de redirecionar
      setTimeout(() => {
        window.location.href = 'login-professor.html'
      }, 3000)
    } else {
      // Extrai mensagem de erro: tenta erros de validação do Laravel primeiro
      let errorMessage = respostaJson.message || 'Falha ao cadastrar professor'
      if (respostaJson.errors) {
        const firstErrorKey = Object.keys(respostaJson.errors)[0]
        errorMessage = respostaJson.errors[firstErrorKey][0]
      }
      console.error('Erro da API:', respostaJson)
      showModal('Erro no Cadastro', errorMessage, 'error')
    }
  } catch (erro) {
    // Trata erro de conexão com servidor
    console.error('Erro na requisição:', erro)
    showModal(
      'Erro de Conexão',
      'Não foi possível conectar ao servidor. Verifique sua rede e tente novamente.',
      'error'
    )
  }
}
}

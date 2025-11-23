/**
 * MÓDULO: Registro de Aluno
 * ================================================
 * Gerencia o processo de registro/cadastro de novos alunos na plataforma.
 * Valida dados, aplica regras de senha e cria conta na API.
 */

/**
 * Realiza o cadastro de um novo usuário (aluno) na plataforma
 * @param {Event} event - Evento do formulário de registro
 * @returns {void}
 */
async function cadastrarUsuario(event) {
  event.preventDefault()

  // Coleta os dados do formulário de registro
  const name = document.getElementById('name').value
  const username = document.getElementById('username').value
  const email = document.getElementById('email').value
  const contact = document.getElementById('contact').value
  const photo_url = document.getElementById('photo_url').value
  const password = document.getElementById('password').value
  const password_confirmation = document.getElementById(
    'password_confirmation'
  ).value

  // Validação de força da senha
  // Requisitos: mínimo 8 caracteres, letras maiúsculas, minúsculas, números e símbolos especiais
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  if (!passwordRegex.test(password)) {
    showModal(
      'Senha Inválida',
      'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um símbolo.',
      'error'
    )
    return
  }

  // Validação de confirmação de senha
  if (password !== password_confirmation) {
    showModal(
      'Senhas Não Coincidem',
      'Os campos de senha e confirmação de senha não são iguais. Por favor, verifique.',
      'error'
    )
    return
  }

  // Prepara o objeto com dados do usuário para envio à API
  const dados = {
    name,
    username,
    email,
    contact,
    password,
    password_confirmation,
    photo_url
  }

  try {
    // Envia requisição POST para registrar o usuário
    const resposta = await fetch(`${API_BASE_URL}/api/cadastrar`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(dados)
    })

    // Processa resposta da API
    const respostaJson = await resposta.json()

    if (resposta.ok) {
      // Sucesso no registro
      showModal(
        'Cadastro Realizado!',
        `Usuário ${dados.name} cadastrado com sucesso! Você já pode fazer o login.`,
        'success'
      )
      document.getElementById('registerForm').reset()

      // Aguarda 5 segundos antes de redirecionar para login
      setTimeout(() => {
        window.location.href = 'login-student.html'
      }, 5000)
    } else {
      // Erro na resposta da API (validação, conflito, etc)
      let errorMessage = respostaJson.message || 'Falha ao cadastrar usuário'

      // Trata erros de validação específicos do Laravel
      if (respostaJson.errors) {
        const firstErrorKey = Object.keys(respostaJson.errors)[0]
        errorMessage = respostaJson.errors[firstErrorKey][0]
      }

      showModal('Erro no Cadastro', errorMessage, 'error')
    }
  } catch (erro) {
    // Erro de conexão ou rede
    showModal(
      'Erro de Conexão',
      'Não foi possível conectar ao servidor. Verifique sua rede e tente novamente.',
      'error'
    )
    console.error('Erro na requisição:', erro)
  }
}

// Associa função ao formulário de registro
document
  .getElementById('registerForm')
  .addEventListener('submit', cadastrarUsuario)

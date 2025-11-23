/**
 * MÓDULO: Login de Professor
 * ================================================
 * Gerencia a autenticação de professores na plataforma.
 * Valida credenciais, armazena token JWT e redireciona ao dashboard.
 */

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('professorLoginForm')

  form.addEventListener('submit', function (e) {
    e.preventDefault()

    // Coleta credenciais do formulário
    const loginData = {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    }

    // Envia credenciais para API de autenticação
    fetch(`${API_BASE_URL}/api/professor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 200) {
          // Armazena token de autenticação JWT e ID do professor no localStorage
          localStorage.setItem('professorToken', data.professor.token)
          localStorage.setItem('professorId', data.professor.id)

          // Exibe mensagem de sucesso com nome do professor
          showModal(
            'Login Bem-Sucedido!',
            `Bem-vindo, Professor(a) ${data.professor.name}! Você será redirecionado.`,
            'success'
          )

          // Aguarda 2 segundos para o usuário ler a mensagem de sucesso antes de redirecionar
          setTimeout(() => {
            window.location.href = 'dashboard-professor.html'
          }, 2000)
        } else {
          // Exibe erro se credenciais são inválidas
          showModal(
            'Erro no Login',
            data.message || 'Credenciais inválidas.',
            'error'
          )
        }
      })
      .catch(error => {
        // Trata erro de conexão com servidor
        console.error('Erro na comunicação com servidor:', error)
        showModal(
          'Erro de Conexão',
          'Não foi possível conectar ao servidor. Tente novamente.',
          'error'
        )
      })
  })
})

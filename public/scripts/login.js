document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm')

  form.addEventListener('submit', function (e) {
    e.preventDefault()

    const loginData = {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    }

    fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 200) {
          // Armazenar o token e o ID
          localStorage.setItem('userToken', data.usuario.token)
          localStorage.setItem('userId', data.usuario.id)

          showModal(
            'Login Bem-Sucedido!',
            `Bem-vindo, ${data.usuario.name}! Você será redirecionado.`,
            'success'
          )

          // Espera 2 segundos para o usuário ler a mensagem e redireciona
          setTimeout(() => {
            window.location.href = 'dashboard-student.html'
          }, 2000)
        } else {
          showModal(
            'Erro no Login',
            data.message || 'Credenciais inválidas.',
            'error'
          )
        }
      })
      .catch(error => {
        console.error('🚀 ~ Erro na comunicação:', error)
        showModal(
          'Erro de Conexão',
          'Não foi possível conectar ao servidor. Tente novamente.',
          'error'
        )
      })
  })
})

/**
 * MÓDULO: Dashboard Administrativo
 * ================================================
 * Gerencia o dashboard do administrador.
 * Valida autenticação, controla logout e configura interatividade.
 */

document.addEventListener('DOMContentLoaded', function () {
  checkAdminAuth()
  setupLogout()
  setupCardHover()
})

/**
 * Verifica autenticação do administrador
 * Redireciona para login se não houver token válido
 */
function checkAdminAuth() {
  const adminToken = localStorage.getItem('adminToken')

  if (!adminToken) {
    window.location.href = 'login-admin.html'
    return
  }

  // Valida token com chamada à API
  verifyAdminToken(adminToken)
}

/**
 * Verifica validade do token JWT do administrador
 * @param {string} token - Token JWT de autenticação
 */
function verifyAdminToken(token) {
  fetch(`${API_BASE_URL}/api/admin/listar`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        // Token expirado ou inválido, redireciona
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminId')
        window.location.href = 'login-admin.html'
      }
    })
    .catch(error => {
      console.error('Erro ao verificar token:', error)
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminId')
      window.location.href = 'login-admin.html'
    })
}

/**
 * Configura evento de logout
 * Busca botão de logout e adiciona listener de clique
 */
function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn')

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault()
      logout()
    })
  }
}

/**
 * Processa logout do administrador
 * Notifica API e limpa sessão local
 */
function logout() {
  const adminToken = localStorage.getItem('adminToken')

  if (adminToken) {
    // Notifica API para invalidar sessão
    fetch(`${API_BASE_URL}/api/admin/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }).finally(() => {
      // Limpa tokens e redireciona para login
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminId')
      window.location.href = 'login-admin.html'
    })
  } else {
    window.location.href = 'login-admin.html'
  }
}

/**
 * Configura efeitos de hover nos cards do dashboard
 * Aplica transformação visual ao passar mouse
 */
function setupCardHover() {
  const adminCards = document.querySelectorAll('.admin-card')

  adminCards.forEach(card => {
    card.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-0.4rem)'
    })

    card.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0)'
    })
  })
}

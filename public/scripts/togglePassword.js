/**
 * MÓDULO: Alternância de Visibilidade de Senha
 * ================================================
 * Permite alternar visibilidade entre senha cifrada e texto aberto.
 * Atualiza ícone conforme o estado do campo.
 */

document.addEventListener('DOMContentLoaded', function () {
  const togglePassword = document.querySelectorAll('.toggle-password')

  togglePassword.forEach(el => {
    el.addEventListener('click', function () {
      // Busca input anterior ao botão de toggle
      const input = this.previousElementSibling
      const icon = this.querySelector('img')

      // Alterna entre modo senha e texto
      if (input.type === 'password') {
        input.type = 'text'
        icon.src = 'public/images/icons/eye-off.svg'
      } else {
        input.type = 'password'
        icon.src = 'public/images/icons/eye.svg'
      }
    })
  })
})

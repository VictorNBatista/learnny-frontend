/**
 * MÓDULO: Validação de Senha
 * ================================================
 * Valida requisitos de segurança da senha em tempo real.
 * Atualiza feedback visual conforme o usuário digita.
 */

document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('password')
  const ruleLength = document.getElementById('rule-length')
  const ruleUppercase = document.getElementById('rule-uppercase')
  const ruleLowercase = document.getElementById('rule-lowercase')
  const ruleNumber = document.getElementById('rule-number')
  const ruleSymbol = document.getElementById('rule-symbol')

  // Valida que todos os elementos de regra existem
  if (
    !passwordInput ||
    !ruleLength ||
    !ruleUppercase ||
    !ruleLowercase ||
    !ruleNumber ||
    !ruleSymbol
  ) {
    return
  }

  // Valida senha a cada entrada de caractere
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value

    // Valida se tem mínimo de 8 caracteres
    ruleLength.classList.toggle('valid', password.length >= 8)

    // Valida se tem ao menos uma letra maiúscula
    ruleUppercase.classList.toggle('valid', /[A-Z]/.test(password))

    // Valida se tem ao menos uma letra minúscula
    ruleLowercase.classList.toggle('valid', /[a-z]/.test(password))

    // Valida se tem ao menos um número
    ruleNumber.classList.toggle('valid', /\d/.test(password))

    // Valida se tem ao menos um símbolo especial
    ruleSymbol.classList.toggle('valid', /[\W_]/.test(password))
  })
})

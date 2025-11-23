/**
 * MÓDULO: Listagem de Professores
 * ================================================
 * Gerencia a exibição e filtro de professores disponíveis.
 * Carrega lista da API, exibe cards com informações e permite busca por matéria.
 */

// Armazena lista original de professores carregada da API
let professoresOriginais = []

/**
 * Busca lista de todos os professores disponíveis da API
 * Valida token de autenticação do aluno
 */
async function listarProfessores() {
  const token = localStorage.getItem('userToken')
  console.log('Token:', token)

  try {
    if (token) {
      // Busca lista de professores da API
      const response = await fetch(`${API_BASE_URL}/api/professor/listar`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Dados recebidos:', data)

        // Armazena lista original para filtros
        professoresOriginais = data.data
        exibirProfessores(professoresOriginais)
      } else {
        const errorData = await response.json()
        console.error('Erro na resposta da API:', response.status, errorData)
        alert(
          'Erro ao buscar os professores: ' +
            (errorData.message || 'Erro desconhecido')
        )
      }
    } else {
      // Redireciona para login se não houver token
      window.location.href = 'login-student.html'
    }
  } catch (error) {
    console.error('Erro na requisição:', error)
    alert('Erro ao carregar a lista de professores')
  }
}

/**
 * Renderiza cards de professores no DOM
 * Cada card exibe: foto, nome, matérias, biografia, preço e botão de agendamento
 * @param {Array} professores - Array de objetos professor com dados a exibir
 */
function exibirProfessores(professores) {
  const teacherContainer = document.querySelector('main')
  teacherContainer.innerHTML = ''

  professores.forEach(professor => {
    // Concatena nomes de todas as matérias do professor
    const materias = professor.subjects.map(s => s.name).join(', ')

    const professorCard = document.createElement('article')
    professorCard.classList.add('teacher-item')

    // Formata preço com 2 casas decimais
    professorCard.innerHTML = `
            <header>
                <img src="${
                  professor.photo_url || 'public/images/default-avatar.svg'
                }" alt="${professor.name}">
                <div>
                    <strong>${professor.name}</strong>
                    <span>${materias}</span>
                </div>
            </header>
            <p>${professor.biography}</p>
            <footer>
                <p>Preço/hora <strong>R$ ${Number(professor.price).toFixed(
                  2
                )}</strong></p>
                <a href="schedule.html?professorId=${
                  professor.id
                }" class="button">
                     <img src="public/images/icons/schedule.svg" alt="Agendar">Agendar Aula
                </a>
            </footer>
        `

    teacherContainer.appendChild(professorCard)
  })
}

/**
 * Normaliza texto removendo acentos e deixando minúsculo
 * Facilita busca/filtro insensível a acentos
 * @param {string} texto - Texto a normalizar
 * @returns {string} - Texto normalizado
 */
function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// Configura listeners de busca no formulário
const formBusca = document.getElementById('search-teachers')
const inputBusca = document.getElementById('searchSubject')

if (formBusca) {
  // Ao submeter formulário, filtra professores por matéria
  formBusca.addEventListener('submit', event => {
    event.preventDefault()
    const termo = normalizarTexto(inputBusca.value.trim())

    if (!termo) {
      exibirProfessores(professoresOriginais)
      return
    }

    // Filtra professores que têm matéria com nome contendo o termo
    const professoresFiltrados = professoresOriginais.filter(professor =>
      professor.subjects.some(s => normalizarTexto(s.name).includes(termo))
    )

    exibirProfessores(professoresFiltrados)
  })

  // Reseta lista quando campo de busca é esvaziado
  inputBusca.addEventListener('input', event => {
    if (event.target.value.trim() === '') {
      exibirProfessores(professoresOriginais)
    }
  })
}

// Carrega lista de professores ao iniciar página
document.addEventListener('DOMContentLoaded', listarProfessores)

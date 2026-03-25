// ── DOM 元素 ──
const searchInput  = document.getElementById('searchInput')
const clearBtn     = document.getElementById('clearBtn')
const welcomeEl    = document.getElementById('welcome')
const resultsEl    = document.getElementById('results')
const emptyEl      = document.getElementById('empty')
const loadingEl    = document.getElementById('loading')
const summaryEl    = document.getElementById('resultsSummary')
const listEl       = document.getElementById('resultsList')
const statsLine    = document.getElementById('statsLine')
const emptyText    = document.getElementById('emptyText')

let debounceTimer = null
let currentQuery  = ''

// ── 初始化：加载统计 ──
async function init() {
  const stats = await api.getStats()
  if (stats.lawCount) {
    statsLine.textContent = `收录 ${stats.lawCount} 部有效法规 · ${stats.articleCount.toLocaleString()} 条法条`
  }

  // 快捷搜索标签
  document.querySelectorAll('.hint-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      searchInput.value = tag.dataset.q
      clearBtn.classList.add('show')
      doSearch(tag.dataset.q)
      searchInput.focus()
    })
  })
}

// ── 搜索入口 ──
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim()
  clearBtn.classList.toggle('show', q.length > 0)

  if (!q) { showView('welcome'); return }

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => doSearch(q), 280)
})

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    clearTimeout(debounceTimer)
    doSearch(searchInput.value.trim())
  }
})

clearBtn.addEventListener('click', () => {
  searchInput.value = ''
  clearBtn.classList.remove('show')
  showView('welcome')
  searchInput.focus()
})

// 全局快捷键
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
    e.preventDefault()
    searchInput.focus()
    searchInput.select()
  }
  if (e.key === 'Escape') {
    searchInput.blur()
  }
})

// ── 执行搜索 ──
async function doSearch(query) {
  if (!query) return
  currentQuery = query

  showView('loading')

  const { laws, total } = await api.search(query)

  if (query !== currentQuery) return // 过期请求

  if (!laws || laws.length === 0) {
    emptyText.textContent = `未找到包含"${query}"的法规`
    showView('empty')
    return
  }

  renderResults(laws, total, query)
  showView('results')
}

// ── 视图切换 ──
function showView(name) {
  welcomeEl.style.display = name === 'welcome' ? '' : 'none'
  resultsEl.style.display = name === 'results' ? '' : 'none'
  emptyEl.style.display   = name === 'empty'   ? '' : 'none'
  loadingEl.style.display = name === 'loading' ? '' : 'none'
}

// ── 渲染结果 ──
function renderResults(laws, total, query) {
  summaryEl.innerHTML = `找到 <b>${laws.length}</b> 部法规，共 <b>${total}</b> 条相关条款`

  const frag = document.createDocumentFragment()

  laws.forEach((law, idx) => {
    const card = document.createElement('div')
    card.className = 'law-card'
    if (idx < 3) card.classList.add('open')

    const statusBadge = law.status === '有效'
      ? '<span class="badge badge-valid">有效</span>'
      : '<span class="badge badge-modified">已修改</span>'

    card.innerHTML = `
      <div class="law-header">
        <div class="law-info">
          <div class="law-title">${esc(law.title)}</div>
          <div class="law-meta">
            <span class="badge badge-type">${esc(law.type)}</span>
            ${statusBadge}
            <span class="badge-office">${esc(law.office)}</span>
            ${law.publish ? `<span class="badge-date">${law.publish.slice(0, 10)}</span>` : ''}
          </div>
        </div>
        <span class="match-count">${law.articles.length} 处</span>
        <svg class="expand-arrow" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="law-articles">
        ${law.articles.map(a => renderArticle(a, query)).join('')}
      </div>
    `

    // 折叠/展开
    card.querySelector('.law-header').addEventListener('click', () => {
      card.classList.toggle('open')
    })

    frag.appendChild(card)
  })

  listEl.innerHTML = ''
  listEl.appendChild(frag)

  // 滚动到顶部
  document.getElementById('main').scrollTop = 0
}

// ── 渲染单条条文 ──
function renderArticle(article, query) {
  return `
    <div class="article-item">
      <div class="article-num">${esc(article.num)}</div>
      <div class="article-body">
        ${article.chapter ? `<div class="article-chapter">${esc(article.chapter)}</div>` : ''}
        <div class="article-text">${highlight(article.text, query)}</div>
      </div>
    </div>
  `
}

// ── 高亮关键词 ──
function highlight(text, query) {
  if (!text || !query) return esc(text)

  const escaped = esc(text)
  const terms = query.split(/\s+/).filter(Boolean)

  let result = escaped
  for (const term of terms) {
    const pattern = new RegExp(escRegex(esc(term)), 'gi')
    result = result.replace(pattern, '<mark>$&</mark>')
  }
  return result
}

// ── 工具函数 ──
function esc(s) {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── 启动 ──
init()
searchInput.focus()

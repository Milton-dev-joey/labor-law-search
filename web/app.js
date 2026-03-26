// ── DOM ──
const searchInput = document.getElementById('searchInput')
const clearBtn    = document.getElementById('clearBtn')
const brandBtn    = document.getElementById('brandBtn')
const favToggle   = document.getElementById('favToggle')
const favCount    = document.getElementById('favCount')
const dbLoading   = document.getElementById('dbLoading')
const dbStatus    = document.getElementById('dbStatus')
const welcomeEl   = document.getElementById('welcome')
const resultsEl   = document.getElementById('results')
const favoritesEl = document.getElementById('favorites')
const emptyEl     = document.getElementById('empty')
const loadingEl   = document.getElementById('loading')
const summaryEl   = document.getElementById('resultsSummary')
const listEl      = document.getElementById('resultsList')
const statsLine   = document.getElementById('statsLine')
const emptyText   = document.getElementById('emptyText')
const favSummary  = document.getElementById('favSummary')
const favList     = document.getElementById('favList')
const favEmpty    = document.getElementById('favEmpty')

const typeList    = document.getElementById('typeList')
const typeAll     = document.getElementById('typeAll')
const regionList  = document.getElementById('regionList')
const regionAll   = document.getElementById('regionAll')
const resetFilters = document.getElementById('resetFilters')

let db = null
let debounceTimer = null
let currentQuery  = ''
let lastRawResults = null
let lastSearchTerms = []
let favorites = loadFavorites()

// ── 地区映射：颁布机关 → 地区 ──
const REGION_MAP = {
  // 全国
  '全国人民代表大会': '全国',
  '全国人民代表大会常务委员会': '全国',
  '国务院': '全国',
  '最高人民法院': '全国',
  '最高人民法院、最高人民检察院': '全国',
  '人力资源和社会保障部': '全国',
  '劳动和社会保障部': '全国',
  '劳动和社会保障部办公厅': '全国',
  '劳动部': '全国',
  '国家统计局': '全国',
}

// 省份简称映射
const PROVINCE_SHORT = {
  '北京市': '北京', '天津市': '天津', '上海市': '上海', '重庆市': '重庆',
  '河北省': '河北', '山西省': '山西', '辽宁省': '辽宁', '吉林省': '吉林',
  '黑龙江省': '黑龙江', '江苏省': '江苏', '浙江省': '浙江', '安徽省': '安徽',
  '福建省': '福建', '江西省': '江西', '山东省': '山东', '河南省': '河南',
  '湖北省': '湖北', '湖南省': '湖南', '广东省': '广东', '海南省': '海南',
  '四川省': '四川', '贵州省': '贵州', '云南省': '云南', '陕西省': '陕西',
  '甘肃省': '甘肃', '青海省': '青海', '台湾省': '台湾',
  '内蒙古自治区': '内蒙古', '广西壮族自治区': '广西', '西藏自治区': '西藏',
  '宁夏回族自治区': '宁夏', '新疆维吾尔自治区': '新疆'
}

// 城市/自治州 → 省份
const CITY_TO_PROVINCE = {
  // 北京
  '北京市人民代表大会常务委员会': '北京市',
  '北京市人民政府': '北京市',
  // 上海
  '上海市人民代表大会常务委员会': '上海市',
  '上海市人民政府': '上海市',
  '上海市人力资源和社会保障局': '上海市',
  '上海市劳动和社会保障局': '上海市',
  '上海市劳动局': '上海市',
  '上海市高级人民法院': '上海市',
  '上海市高级人民法院、上海市劳动人事争议仲裁委员会': '上海市',
  // 天津
  '天津市人民代表大会常务委员会': '天津市',
  // 重庆
  '重庆市人民代表大会常务委员会': '重庆市',
  // 广东
  '广州市人民代表大会常务委员会': '广东省',
  '深圳市人民代表大会常务委员会': '广东省',
  '珠海市人民代表大会常务委员会': '广东省',
  // 江苏
  '江苏省人民代表大会': '江苏省',
  '江苏省人民代表大会常务委员会': '江苏省',
  '徐州市人民代表大会常务委员会': '江苏省',
  '无锡市人民代表大会常务委员会': '江苏省',
  '南京市人民代表大会常务委员会': '江苏省',
  // 浙江
  '浙江省人民代表大会常务委员会': '浙江省',
  '杭州市人民代表大会常务委员会': '浙江省',
  '宁波市人民代表大会常务委员会': '浙江省',
  // 四川
  '四川省人民代表大会常务委员会': '四川省',
  '成都市人民代表大会常务委员会': '四川省',
  // 陕西
  '陕西省人民代表大会常务委员会': '陕西省',
  '西安市人民代表大会常务委员会': '陕西省',
  // 山东
  '山东省人民代表大会常务委员会': '山东省',
  '济南市人民代表大会常务委员会': '山东省',
  '青岛市人民代表大会常务委员会': '山东省',
  // 湖北
  '湖北省人民代表大会常务委员会': '湖北省',
  '武汉市人民代表大会常务委员会': '湖北省',
  // 湖南
  '湖南省人民代表大会常务委员会': '湖南省',
  // 河南
  '河南省人民代表大会常务委员会': '河南省',
  '郑州市人民代表大会常务委员会': '河南省',
  // 河北
  '河北省人民代表大会常务委员会': '河北省',
  '石家庄市人民代表大会常务委员会': '河北省',
  '唐山市人民代表大会常务委员会': '河北省',
  // 山西
  '山西省人民代表大会常务委员会': '山西省',
  '大同市人民代表大会常务委员会': '山西省',
  // 辽宁
  '辽宁省人民代表大会常务委员会': '辽宁省',
  '沈阳市人民代表大会常务委员会': '辽宁省',
  '大连市人民代表大会常务委员会': '辽宁省',
  '鞍山市人民代表大会常务委员会': '辽宁省',
  '抚顺市人民代表大会常务委员会': '辽宁省',
  '本溪市人民代表大会常务委员会': '辽宁省',
  // 吉林
  '吉林省人民代表大会常务委员会': '吉林省',
  '延边朝鲜族自治州人民代表大会': '吉林省',
  // 黑龙江
  '黑龙江省人民代表大会常务委员会': '黑龙江省',
  '哈尔滨市人民代表大会常务委员会': '黑龙江省',
  // 安徽
  '安徽省人民代表大会常务委员会': '安徽省',
  '合肥市人民代表大会常务委员会': '安徽省',
  // 福建
  '福建省人民代表大会常务委员会': '福建省',
  '福州市人民代表大会常务委员会': '福建省',
  '厦门市人民代表大会常务委员会': '福建省',
  // 江西
  '江西省人民代表大会常务委员会': '江西省',
  '南昌市人民代表大会常务委员会': '江西省',
  // 海南
  '海南省人民代表大会常务委员会': '海南省',
  // 云南
  '云南省人民代表大会常务委员会': '云南省',
  '昆明市人民代表大会常务委员会': '云南省',
  '红河哈尼族彝族自治州人民代表大会': '云南省',
  // 贵州
  '贵州省人民代表大会常务委员会': '贵州省',
  '贵阳市人民代表大会常务委员会': '贵州省',
  // 甘肃
  '甘肃省人民代表大会常务委员会': '甘肃省',
  // 青海
  '青海省人民代表大会常务委员会': '青海省',
  // 内蒙古
  '内蒙古自治区人民代表大会常务委员会': '内蒙古自治区',
  '呼和浩特市人民代表大会常务委员会': '内蒙古自治区',
  '包头市人民代表大会常务委员会': '内蒙古自治区',
  // 广西
  '广西壮族自治区人民代表大会常务委员会': '广西壮族自治区',
  // 西藏
  '西藏自治区人民代表大会常务委员会': '西藏自治区',
  // 宁夏
  '宁夏回族自治区人民代表大会常务委员会': '宁夏回族自治区',
  // 新疆
  '新疆维吾尔自治区人民代表大会常务委员会': '新疆维吾尔自治区',
  '乌鲁木齐市人民代表大会常务委员会': '新疆维吾尔自治区'
}

function getRegion(office) {
  if (REGION_MAP[office]) return REGION_MAP[office]
  if (CITY_TO_PROVINCE[office]) return PROVINCE_SHORT[CITY_TO_PROVINCE[office]] || CITY_TO_PROVINCE[office]
  // 检查是否是省份本身
  if (PROVINCE_SHORT[office]) return PROVINCE_SHORT[office]
  return '其他'
}

// ── 收藏 localStorage ──
const FAV_KEY = 'labor-law-favorites'

function loadFavorites() {
  try {
    const s = localStorage.getItem(FAV_KEY)
    if (s) {
      const arr = JSON.parse(s)
      return Array.isArray(arr) ? arr : []
    }
  } catch (e) {}
  return []
}

function saveFavorites() {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites))
  } catch (e) {}
  updateFavCount()
}

function updateFavCount() {
  const n = favorites.length
  favCount.textContent = n
  favCount.style.display = n > 0 ? 'flex' : 'none'
  if (n > 0) favToggle.classList.add('active')
  else favToggle.classList.remove('active')
}

function isFavorited(lawId) {
  return favorites.some(f => f.id === lawId)
}

function toggleFavorite(lawId, lawData) {
  const idx = favorites.findIndex(f => f.id === lawId)
  if (idx >= 0) {
    favorites.splice(idx, 1)
  } else if (lawData) {
    favorites.push({
      id: lawId,
      title: lawData.title,
      type: lawData.type,
      status: lawData.status,
      office: lawData.office,
      publish: lawData.publish,
      articleCount: lawData.articles.length,
      preview: lawData.articles[0]?.text?.slice(0, 100) || '',
      addedAt: Date.now()
    })
  }
  saveFavorites()
}

// ── 文件句柄存储键 ──
const DB_FILE_HANDLE_KEY = 'labor-law-db-file-handle'
let dbFileHandle = null

// ── 请求持久化权限 ──
async function verifyPermission(fileHandle) {
  const options = { mode: 'read' }
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true
  }
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true
  }
  return false
}

// ── 保存文件句柄 ──
async function saveFileHandle(handle) {
  try {
    dbFileHandle = handle
    await handle.requestPermission({ mode: 'read' })
  } catch (e) {}
}

// ── 选择数据库文件 ──
async function pickDatabaseFile() {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'SQLite Database',
        accept: { 'application/x-sqlite3': ['.db'] }
      }],
      multiple: false
    })
    return fileHandle
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('用户取消了文件选择')
    }
    throw e
  }
}

// ── 加载数据库文件 ──
async function loadDatabaseFile() {
  dbStatus.textContent = '请选择数据库文件…'

  const fileHandle = await pickDatabaseFile()
  await saveFileHandle(fileHandle)

  const file = await fileHandle.getFile()
  if (!file.name.endsWith('.db')) {
    throw new Error('请选择 .db 格式的数据库文件')
  }

  dbStatus.textContent = '正在读取数据库…'
  const buf = await file.arrayBuffer()
  return buf
}

// ── 检查浏览器支持 ──
function checkBrowserSupport() {
  if (!('showOpenFilePicker' in window)) {
    dbStatus.textContent = '当前浏览器不支持文件选择'
    document.querySelector('.db-hint').innerHTML = `
      <p>请使用 Chrome、Edge 或其他支持 File System Access API 的浏览器</p>
      <p style="margin-top:8px;">或者使用本地服务器方式：</p>
      <code style="display:block;margin-top:8px;padding:8px;background:#f0f0f0;border-radius:4px;">python -m http.server 8080</code>
    `
    return false
  }
  return true
}

// ── 初始化 ──
async function init() {
  const isFileProtocol = location.protocol === 'file:'

  // file:// 协议下无法使用 fetch，必须提示用户使用服务器
  if (isFileProtocol) {
    dbStatus.innerHTML = '无法通过 file:// 协议加载'
    document.querySelector('.db-hint').innerHTML = `
      <p><b>请使用本地服务器方式运行</b></p>
      <div style="margin-top:16px;padding:16px;background:#f8f9fa;border-radius:8px;text-align:left;">
        <p><b>方法1（推荐）：双击启动脚本</b></p>
        <ul style="margin:8px 0;padding-left:20px;">
          <li>Windows: 双击 "启动.bat"</li>
          <li>Mac: 双击 "启动.command"</li>
        </ul>
        <p style="margin-top:12px;"><b>方法2：手动启动服务器</b></p>
        <code style="display:block;margin-top:8px;padding:12px;background:#e9ecef;border-radius:4px;font-size:13px;">cd web<br>python -m http.server 8080</code>
        <p style="margin-top:8px;">然后访问 <code>http://localhost:8080</code></p>
      </div>
    `
    return
  }

  try {
    dbStatus.textContent = '正在加载 sql.js 引擎…'

    // 加载 wasm 文件
    const wasmResp = await fetch('sql-wasm.wasm')
    if (!wasmResp.ok) {
      throw new Error(`无法加载 sql-wasm.wasm: ${wasmResp.status}`)
    }
    const wasmBinary = await wasmResp.arrayBuffer()
    const SQL = await initSqlJs({ wasmBinary })

    // 通过 HTTP 加载数据库文件
    dbStatus.textContent = '正在加载数据库…'
    // 尝试多个可能的数据库路径
    let dbResp = await fetch('/laws_dev.db')
    if (!dbResp.ok) {
      dbResp = await fetch('../laws_dev.db')
    }
    if (!dbResp.ok) {
      throw new Error(`无法加载数据库: ${dbResp.status}. 请确保 laws_dev.db 与 web 文件夹在同一目录`)
    }
    const buf = await dbResp.arrayBuffer()

    dbStatus.textContent = '正在解析数据库…'
    db = new SQL.Database(new Uint8Array(buf))

    // 加载统计
    const stats = queryOne('SELECT COUNT(*) as c FROM laws WHERE status IN ("有效","已修改")')
    const articleCount = queryOne('SELECT COUNT(*) as c FROM law_articles')
    if (stats) {
      statsLine.textContent = `收录 ${stats.c} 部有效法规 · ${articleCount.c.toLocaleString()} 条法条`
    }

    // 加载筛选选项
    loadFilterOptions()

    // 恢复收藏状态
    updateFavCount()

    // 启用搜索
    searchInput.disabled = false
    showView('welcome')
    searchInput.focus()

  } catch (err) {
    console.error(err)
    dbStatus.innerHTML = '数据库加载失败'
    document.querySelector('.db-hint').innerHTML = `
      <p>${err.message}</p>
      <button onclick="location.reload()" style="margin-top:12px;padding:8px 16px;border:1px solid var(--accent);background:var(--accent-light);color:var(--accent);border-radius:6px;cursor:pointer;">重试</button>
    `
  }
}

function queryOne(sql) {
  const res = db.exec(sql)
  if (!res[0]) return null
  const cols = res[0].columns
  const vals = res[0].values[0]
  const obj = {}
  cols.forEach((c, i) => obj[c] = vals[i])
  return obj
}

// ── 加载筛选选项 ──
let allTypes = []
let allRegions = []

function loadFilterOptions() {
  // 法规类型
  const types = db.exec('SELECT DISTINCT type FROM laws WHERE status IN ("有效","已修改") AND type IS NOT NULL ORDER BY type')
  if (types[0]) {
    allTypes = types[0].values.map(v => v[0]).filter(Boolean)
    allTypes.forEach(t => {
      const label = document.createElement('label')
      label.className = 'cb-label'
      label.innerHTML = `<input type="checkbox" class="type-cb" value="${esc(t)}"><span>${esc(t)}</span>`
      typeList.appendChild(label)
    })
  }

  // 地区（从颁布机关推导）
  const offices = db.exec('SELECT DISTINCT office FROM laws WHERE status IN ("有效","已修改") AND office IS NOT NULL')
  if (offices[0]) {
    const regionSet = new Set()
    offices[0].values.forEach(v => {
      const region = getRegion(v[0])
      regionSet.add(region)
    })
    // 排序：全国排第一，其他按拼音
    allRegions = Array.from(regionSet).sort((a, b) => {
      if (a === '全国') return -1
      if (b === '全国') return 1
      return a.localeCompare(b, 'zh')
    })
    allRegions.forEach(r => {
      const label = document.createElement('label')
      label.className = 'cb-label'
      label.innerHTML = `<input type="checkbox" class="region-cb" value="${esc(r)}"><span>${esc(r)}</span>`
      regionList.appendChild(label)
    })
  }

  // 绑定复选框事件
  bindCheckboxEvents()
}

function bindCheckboxEvents() {
  // 类型全选
  typeAll.addEventListener('change', () => {
    document.querySelectorAll('.type-cb').forEach(cb => cb.checked = typeAll.checked)
    applyFilters()
  })
  document.querySelectorAll('.type-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const allChecked = [...document.querySelectorAll('.type-cb')].every(c => c.checked)
      typeAll.checked = allChecked
      applyFilters()
    })
  })

  // 地区全选
  regionAll.addEventListener('change', () => {
    document.querySelectorAll('.region-cb').forEach(cb => cb.checked = regionAll.checked)
    applyFilters()
  })
  document.querySelectorAll('.region-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const allChecked = [...document.querySelectorAll('.region-cb')].every(c => c.checked)
      regionAll.checked = allChecked
      applyFilters()
    })
  })

  // 时间单选
  document.querySelectorAll('input[name="dateRange"]').forEach(r => {
    r.addEventListener('change', applyFilters)
  })

  // 面板折叠
  document.querySelectorAll('.filter-title').forEach(title => {
    title.addEventListener('click', () => {
      const panelId = title.dataset.toggle
      const panel = document.getElementById(panelId)
      const section = title.closest('.filter-section')
      section.classList.toggle('open')
    })
  })

  // 默认展开类型和地区
  document.querySelector('.filter-section').classList.add('open')
  document.querySelector('.filter-section:nth-child(2)').classList.add('open')
}

// ── 搜索事件 ──
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

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
    e.preventDefault()
    searchInput.focus()
    searchInput.select()
  }
  if (e.key === 'Escape') searchInput.blur()
})

resetFilters.addEventListener('click', resetAllFilters)

function resetAllFilters() {
  typeAll.checked = true
  document.querySelectorAll('.type-cb').forEach(cb => cb.checked = true)
  regionAll.checked = true
  document.querySelectorAll('.region-cb').forEach(cb => cb.checked = true)
  document.querySelector('input[name="dateRange"][value=""]').checked = true
  applyFilters()
}

document.querySelectorAll('.hint-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    searchInput.value = tag.dataset.q
    clearBtn.classList.add('show')
    doSearch(tag.dataset.q)
    searchInput.focus()
  })
})

// 品牌点击返回首页
brandBtn.addEventListener('click', () => {
  searchInput.value = ''
  clearBtn.classList.remove('show')
  showView('welcome')
  searchInput.focus()
})

// 收藏按钮切换
favToggle.addEventListener('click', () => {
  renderFavorites()
  showView('favorites')
})

// ── 执行搜索 ──
async function doSearch(query) {
  if (!query || !db) return
  currentQuery = query

  showView('loading')

  // 同义词扩展
  const terms = [query]
  try {
    const synStmt = db.prepare('SELECT expand FROM synonyms WHERE term = ?')
    synStmt.bind([query])
    while (synStmt.step()) {
      terms.push(synStmt.getAsObject().expand)
    }
    synStmt.free()
  } catch (e) {}

  lastSearchTerms = terms

  // LIKE 查询
  const likeClauses = terms.map(() => 'a.article_text LIKE ?').join(' OR ')
  const likeParams = terms.map(t => `%${t}%`)

  const sql = `
    SELECT
      l.id        AS law_id,
      l.title,
      l.type,
      l.status,
      l.office,
      l.publish,
      a.id        AS article_id,
      a.article_num,
      a.chapter,
      a.article_text
    FROM law_articles a
    JOIN laws l ON a.law_id = l.id
    WHERE (${likeClauses})
      AND l.status IN ('有效','已修改')
    ORDER BY l.publish DESC, a.sort_order
    LIMIT 800
  `

  try {
    const stmt = db.prepare(sql)
    stmt.bind(likeParams)

    const rows = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()

    if (query !== currentQuery) return

    lastRawResults = rows

    // 重置筛选为全选
    resetAllFilters()

  } catch (err) {
    console.error('[Search]', err)
    emptyText.textContent = `搜索出错：${err.message}`
    showView('empty')
  }
}

// ── 应用筛选 ──
function applyFilters() {
  if (!lastRawResults) return

  let rows = lastRawResults

  // 类型筛选（任一选中即可）
  const selectedTypes = [...document.querySelectorAll('.type-cb:checked')].map(cb => cb.value)
  if (selectedTypes.length > 0 && selectedTypes.length < allTypes.length) {
    rows = rows.filter(r => selectedTypes.includes(r.type))
  }

  // 地区筛选（任一选中即可）
  const selectedRegions = [...document.querySelectorAll('.region-cb:checked')].map(cb => cb.value)
  if (selectedRegions.length > 0 && selectedRegions.length < allRegions.length) {
    rows = rows.filter(r => selectedRegions.includes(getRegion(r.office)))
  }

  // 时间筛选
  const dateVal = document.querySelector('input[name="dateRange"]:checked').value
  if (dateVal) {
    const now = new Date()
    let cutoff
    if (dateVal === '1y') cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    else if (dateVal === '3y') cutoff = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate())
    else if (dateVal === '5y') cutoff = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
    else if (dateVal === '10y') cutoff = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate())

    if (cutoff) {
      const cutStr = cutoff.toISOString().slice(0, 10)
      rows = rows.filter(r => r.publish && r.publish.slice(0, 10) >= cutStr)
    }
  }

  // 分组
  const lawMap = new Map()
  rows.forEach(r => {
    if (!lawMap.has(r.law_id)) {
      lawMap.set(r.law_id, {
        id: r.law_id,
        title: r.title,
        type: r.type,
        status: r.status,
        office: r.office,
        publish: r.publish,
        articles: []
      })
    }
    lawMap.get(r.law_id).articles.push({
      id: r.article_id,
      num: r.article_num,
      chapter: r.chapter,
      text: r.article_text
    })
  })

  const laws = Array.from(lawMap.values())

  if (laws.length === 0) {
    emptyText.textContent = `未找到包含"${currentQuery}"的法规`
    showView('empty')
    return
  }

  renderResults(laws, rows.length)
  showView('results')
}

// ── 视图切换 ──
function showView(name) {
  dbLoading.style.display   = name === 'dbLoading'  ? '' : 'none'
  welcomeEl.style.display   = name === 'welcome'    ? '' : 'none'
  resultsEl.style.display   = name === 'results'    ? '' : 'none'
  favoritesEl.style.display = name === 'favorites'  ? '' : 'none'
  emptyEl.style.display     = name === 'empty'      ? '' : 'none'
  loadingEl.style.display   = name === 'loading'    ? '' : 'none'
}

// ── 渲染结果 ──
function renderResults(laws, total) {
  summaryEl.innerHTML = `找到 <b>${laws.length}</b> 部法规，共 <b>${total}</b> 条相关条款`

  const frag = document.createDocumentFragment()

  laws.forEach((law) => {
    const card = createLawCard(law)
    frag.appendChild(card)
  })

  listEl.innerHTML = ''
  listEl.appendChild(frag)

  window.scrollTo(0, 0)
}

function createLawCard(law, isFavoritePage = false) {
  const card = document.createElement('div')
  card.className = 'law-card'
  // 默认不展开
  // if (!isFavoritePage) card.classList.add('open')

  const statusBadge = law.status === '有效'
    ? '<span class="badge badge-valid">有效</span>'
    : '<span class="badge badge-modified">已修改</span>'

  const region = getRegion(law.office)

  const favActive = isFavorited(law.id) ? 'active' : ''

  card.innerHTML = `
    <div class="law-header">
      <button class="fav-btn ${favActive}" data-law-id="${law.id}" title="${isFavorited(law.id) ? '取消收藏' : '收藏'}">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
          <path d="M10 3l2.2 4.5 4.8.7-3.5 3.4.8 4.9L10 14.3 5.7 16.5l.8-4.9L3 8.2l4.8-.7L10 3z"/>
        </svg>
      </button>
      <div class="law-info">
        <div class="law-title">${esc(law.title)}</div>
        <div class="law-meta">
          <span class="badge badge-type">${esc(law.type)}</span>
          ${statusBadge}
          <span class="badge-office">${esc(region)}</span>
          ${law.publish ? `<span class="badge-date">${law.publish.slice(0, 10)}</span>` : ''}
        </div>
      </div>
      <span class="match-count">${law.articles ? law.articles.length : law.articleCount} 条</span>
      <svg class="expand-arrow" viewBox="0 0 16 16" fill="none">
        <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="law-articles">
      ${law.articles ? law.articles.map(a => renderArticle(a)).join('') : ''}
    </div>
  `

  // 折叠/展开
  const header = card.querySelector('.law-header')
  header.addEventListener('click', (e) => {
    if (e.target.closest('.fav-btn')) return
    card.classList.toggle('open')
  })

  // 收藏按钮
  const favBtn = card.querySelector('.fav-btn')
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    const isActive = favBtn.classList.contains('active')
    if (isActive) {
      favBtn.classList.remove('active')
      favBtn.title = '收藏'
      toggleFavorite(law.id)
    } else {
      favBtn.classList.add('active')
      favBtn.title = '取消收藏'
      toggleFavorite(law.id, law)
    }
    // 如果在收藏页，刷新列表
    if (isFavoritePage) {
      renderFavorites()
    }
  })

  return card
}

// ── 渲染条文 ──
function renderArticle(article) {
  return `
    <div class="article-item">
      <div class="article-num">${esc(article.num)}</div>
      <div class="article-body">
        ${article.chapter ? `<div class="article-chapter">${esc(article.chapter)}</div>` : ''}
        <div class="article-text">${highlight(article.text)}</div>
      </div>
    </div>
  `
}

// ── 渲染收藏页 ──
function renderFavorites() {
  const n = favorites.length
  favSummary.textContent = n > 0 ? `共 ${n} 部` : ''

  if (n === 0) {
    favList.innerHTML = ''
    favEmpty.style.display = ''
    return
  }

  favEmpty.style.display = 'none'

  const frag = document.createDocumentFragment()

  favorites.forEach(fav => {
    const card = document.createElement('div')
    card.className = 'fav-card'

    const statusBadge = fav.status === '有效'
      ? '<span class="badge badge-valid">有效</span>'
      : '<span class="badge badge-modified">已修改</span>'

    const region = getRegion(fav.office)

    card.innerHTML = `
      <div class="fav-card-header">
        <div class="fav-card-content">
          <div class="fav-card-title">${esc(fav.title)}</div>
          <div class="fav-card-meta">
            <span class="badge badge-type">${esc(fav.type)}</span>
            ${statusBadge}
            <span>${esc(region)}</span>
            ${fav.publish ? `<span>· ${fav.publish.slice(0, 10)}</span>` : ''}
          </div>
          ${fav.preview ? `<div class="fav-preview">${esc(fav.preview)}</div>` : ''}
          <div class="fav-article-count">${fav.articleCount} 条相关条款</div>
        </div>
        <button class="fav-remove" title="取消收藏">
          <svg viewBox="0 0 20 20" width="18" height="18" stroke="currentColor" stroke-width="1.5">
            <path d="M5 5l10 10M15 5l-10 10" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `

    card.querySelector('.fav-remove').addEventListener('click', () => {
      toggleFavorite(fav.id)
      renderFavorites()
    })

    frag.appendChild(card)
  })

  favList.innerHTML = ''
  favList.appendChild(frag)
}

// ── 高亮 ──
function highlight(text) {
  if (!text || !lastSearchTerms.length) return esc(text)
  const escaped = esc(text)
  let result = escaped
  for (const term of lastSearchTerms) {
    const pattern = new RegExp(escRegex(esc(term)), 'gi')
    result = result.replace(pattern, '<mark>$&</mark>')
  }
  return result
}

// ── 工具函数 ──
function esc(s) {
  if (!s) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── 启动 ──
init()

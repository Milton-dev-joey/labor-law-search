const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let db = null
let mainWindow = null

// ── 数据库加载（使用 sql.js-fts5 以支持 FTS5）──
async function loadDatabase() {
  const initSqlJs = require('sql.js-fts5')

  const wasmDir = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'sql.js-fts5', 'dist')
    : path.join(__dirname, 'node_modules', 'sql.js-fts5', 'dist')

  const wasmBinary = fs.readFileSync(path.join(wasmDir, 'sql-wasm.wasm'))
  const SQL = await initSqlJs({ wasmBinary })

  const dbPath = app.isPackaged
    ? path.join(process.resourcesPath, 'laws_dev.db')
    : path.join(__dirname, '..', '劳动法规通(1)', 'laws_dev.db')

  const buf = fs.readFileSync(dbPath)
  db = new SQL.Database(buf)
  console.log('[DB] Loaded', dbPath, `(${(buf.length / 1024 / 1024).toFixed(1)} MB)`)
}

// ── 窗口创建 ──
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1060,
    height: 740,
    minWidth: 760,
    minHeight: 520,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#f8fafc',
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 }
  })

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  mainWindow.once('ready-to-show', () => mainWindow.show())
}

// ── 搜索：同义词扩展 + LIKE 全文检索 ──
function doSearch(query) {
  if (!db || !query) return { laws: [], total: 0 }

  const q = query.trim()
  if (!q) return { laws: [], total: 0 }

  // 1) 同义词扩展
  const synStmt = db.prepare('SELECT expand FROM synonyms WHERE term = ?')
  synStmt.bind([q])
  const terms = [q]
  while (synStmt.step()) terms.push(synStmt.getAsObject().expand)
  synStmt.free()

  // 2) 构建 LIKE 条件（对每个词做 OR）
  const likeClauses = terms.map(() => 'a.article_text LIKE ?').join(' OR ')
  const likeParams = terms.map(t => `%${t}%`)

  // 3) 查询匹配条文
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
    LIMIT 600
  `
  const stmt = db.prepare(sql)
  stmt.bind(likeParams)

  const lawMap = new Map()
  let total = 0

  while (stmt.step()) {
    const r = stmt.getAsObject()
    total++
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
  }
  stmt.free()

  return { laws: Array.from(lawMap.values()), total }
}

// ── 获取数据库概览 ──
function getStats() {
  if (!db) return {}
  const row = (sql) => {
    const res = db.exec(sql)
    return res[0] ? res[0].values[0][0] : 0
  }
  return {
    lawCount: row('SELECT COUNT(*) FROM laws WHERE status IN ("有效","已修改")'),
    articleCount: row('SELECT COUNT(*) FROM law_articles'),
    synonymCount: row('SELECT COUNT(*) FROM synonyms')
  }
}

// ── IPC 处理 ──
ipcMain.handle('search', (_e, query) => {
  try { return doSearch(query) }
  catch (err) { console.error('[Search Error]', err); return { laws: [], total: 0 } }
})

ipcMain.handle('get-stats', () => {
  try { return getStats() }
  catch (err) { return {} }
})

ipcMain.on('win:minimize', () => mainWindow?.minimize())
ipcMain.on('win:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('win:close', () => mainWindow?.close())

// ── 应用生命周期 ──
app.whenReady().then(async () => {
  await loadDatabase()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

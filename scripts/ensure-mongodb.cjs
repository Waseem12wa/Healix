const fs = require('fs')
const net = require('net')
const path = require('path')
const { spawn } = require('child_process')

const HOST = process.env.MONGO_HOST || '127.0.0.1'
const PORT = Number(process.env.MONGO_PORT || 27017)

const workspaceRoot = path.resolve(__dirname, '..')
const legacyDbPath = path.join(workspaceRoot, '.mongo-data-legacy')
const defaultDbPath = path.join(workspaceRoot, '.mongo-data')
const defaultLogDir = path.join(workspaceRoot, '.mongo-log')
const defaultLogPath = path.join(defaultLogDir, 'mongod.log')
const logPath = process.env.MONGO_LOGPATH || defaultLogPath

const legacySourceCandidates = [
  'C:\\Program Files\\MongoDB\\Server\\8.0\\data',
  'C:\\data\\db',
]

const defaultCandidates = [
  process.env.MONGOD_PATH,
  'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
  'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
  'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
].filter(Boolean)

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isPortOpen(host, port, timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false

    const finish = (result) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }

    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.once('timeout', () => finish(false))
    socket.connect(port, host)
  })
}

async function waitForPort(host, port, retries = 20, delayMs = 500) {
  for (let i = 0; i < retries; i += 1) {
    if (await isPortOpen(host, port)) {
      return true
    }
    await wait(delayMs)
  }
  return false
}

function resolveMongodPath() {
  for (const candidate of defaultCandidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

function fileCount(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) return 0
  let total = 0
  const stack = [dirPath]

  while (stack.length > 0) {
    const current = stack.pop()
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const nextPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(nextPath)
      } else if (entry.isFile()) {
        total += 1
      }
    }
  }

  return total
}

function selectDbPath() {
  if (process.env.MONGO_DBPATH) {
    return process.env.MONGO_DBPATH
  }

  const legacyCount = fileCount(legacyDbPath)
  if (legacyCount > 0) {
    return legacyDbPath
  }

  return defaultDbPath
}

function tryImportLegacyData() {
  if (process.env.MONGO_DBPATH) return

  const legacyCount = fileCount(legacyDbPath)
  if (legacyCount > 0) return

  for (const sourcePath of legacySourceCandidates) {
    const sourceCount = fileCount(sourcePath)
    if (sourceCount === 0) continue

    try {
      fs.mkdirSync(legacyDbPath, { recursive: true })
      fs.cpSync(sourcePath, legacyDbPath, { recursive: true })
      console.log(`Imported legacy MongoDB data from ${sourcePath} to ${legacyDbPath}`)
      return
    } catch (error) {
      console.log(`Could not import legacy data from ${sourcePath}: ${error.message}`)
    }
  }
}

async function main() {
  tryImportLegacyData()
  const dbPath = selectDbPath()

  if (await isPortOpen(HOST, PORT)) {
    console.log(`MongoDB already reachable at ${HOST}:${PORT}`)
    console.log(`Expected dbPath for this project: ${dbPath}`)
    return
  }

  fs.mkdirSync(dbPath, { recursive: true })
  fs.mkdirSync(path.dirname(logPath), { recursive: true })

  const mongodPath = resolveMongodPath()
  if (!mongodPath) {
    console.error('Could not find mongod executable. Set MONGOD_PATH env var and retry.')
    process.exit(1)
  }

  const args = [
    '--dbpath', dbPath,
    '--logpath', logPath,
    '--bind_ip', HOST,
    '--port', String(PORT),
  ]

  // Spawn detached so dev shell can continue and backend can connect.
  const child = spawn(mongodPath, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  })

  child.unref()

  const up = await waitForPort(HOST, PORT)
  if (!up) {
    console.error(`MongoDB did not become reachable on ${HOST}:${PORT}. Check log: ${logPath}`)
    process.exit(1)
  }

  console.log(`MongoDB started on ${HOST}:${PORT}`)
  console.log(`dbPath: ${dbPath}`)
}

main().catch((err) => {
  console.error('Failed to ensure MongoDB:', err.message)
  process.exit(1)
})

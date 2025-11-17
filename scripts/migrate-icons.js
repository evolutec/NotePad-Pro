#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.resolve(__dirname, '..', 'config.json')

function backupConfig(origPath) {
  try {
    const dest = origPath + '.bak.' + Date.now()
    fs.copyFileSync(origPath, dest)
    console.log('Backup created at', dest)
  } catch (e) {
    console.warn('Could not create backup:', e.message)
  }
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
  return JSON.parse(raw)
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8')
}

function looksLikeCollapsed(m) {
  if (!m) return false
  if (m.context === 'collapsed') return true
  const k = (m.key || '').toLowerCase()
  const l = (m.label || '').toLowerCase()
  if (k.includes('collapsed') || k.includes('réduit') || l.includes('réduit') || l.includes('collapsed')) return true
  return false
}

function migrate() {
  const cfg = loadConfig()
  if (!cfg) {
    console.error('config.json not found at', CONFIG_PATH)
    process.exit(1)
  }

  backupConfig(CONFIG_PATH)

  const icons = cfg.icons || {}
  const mappings = Array.isArray(icons.mappings) ? icons.mappings.slice() : []
  const collapsed = Array.isArray(icons.collapsedMappings) ? icons.collapsedMappings.slice() : []

  const remaining = []
  mappings.forEach(m => {
    if (looksLikeCollapsed(m)) {
      // avoid duplicates
      if (!collapsed.some(c => c.key === m.key)) collapsed.push(m)
    } else {
      remaining.push(m)
    }
  })

  icons.mappings = remaining
  icons.collapsedMappings = collapsed
  cfg.icons = icons

  saveConfig(cfg)
  console.log('Migration complete. Mappings:', icons.mappings.length, 'CollapsedMappings:', icons.collapsedMappings.length)
}

migrate()

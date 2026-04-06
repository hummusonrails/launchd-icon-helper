// main app component managing state and layout
import React, { useState, useEffect, useCallback } from 'react'
import TopBar from './components/TopBar'
import AgentSection from './components/AgentSection'
import AddNew from './components/AddNew'

// domain display names and render order
const sections = [
  { domain: 'user', title: 'My Agents' },
  { domain: 'system-agents', title: 'System Agents' },
  { domain: 'system-daemons', title: 'System Services' },
]

export default function App() {
  const [agents, setAgents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedAgent, setExpandedAgent] = useState(null)
  const [showAddNew, setShowAddNew] = useState(false)
  const [loading, setLoading] = useState(true)

  // fetch all agents from the main process
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.launchd.getAgents()
      setAgents(result)
    } catch (err) {
      console.error('failed to load agents', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // filter agents by search query against label and display name
  const filtered = agents.filter((a) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.label.toLowerCase().includes(q) || a.displayName.toLowerCase().includes(q)
  })

  // group filtered agents by domain
  const grouped = sections.map((s) => ({
    ...s,
    agents: filtered.filter((a) => a.domain === s.domain),
  }))

  // toggle an agent on or off
  const handleToggle = async (label, domain, enabled) => {
    await window.launchd.toggleAgent(label, domain, enabled)
    refresh()
  }

  // expand or collapse an agent detail panel
  const handleExpand = (label) => {
    setExpandedAgent(expandedAgent === label ? null : label)
  }

  // save agent config
  const handleSave = async (config) => {
    await window.launchd.saveAgent(config)
    setShowAddNew(false)
    refresh()
  }

  // remove an agent
  const handleRemove = async (label, domain) => {
    await window.launchd.removeAgent(label, domain)
    setExpandedAgent(null)
    refresh()
  }

  return (
    <div className="app">
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddNew={() => setShowAddNew(true)}
      />
      <div className="content">
        {loading && <div className="loading-spinner" />}
        {!loading && filtered.length === 0 && (
          <div className="empty-state">no agents found</div>
        )}
        {!loading && grouped.map((section) => (
          section.agents.length > 0 && (
            <AgentSection
              key={section.domain}
              title={section.title}
              domain={section.domain}
              agents={section.agents}
              expandedAgent={expandedAgent}
              onToggle={handleToggle}
              onExpand={handleExpand}
              onSave={handleSave}
              onRemove={handleRemove}
              onRefresh={refresh}
            />
          )
        ))}
      </div>
      <div className="app-footer">
        <button className="btn-quit" onClick={() => window.launchd.quit()}>
          Quit Launchd Helper
        </button>
      </div>
      {showAddNew && (
        <AddNew
          onSave={handleSave}
          onCancel={() => setShowAddNew(false)}
        />
      )}
    </div>
  )
}

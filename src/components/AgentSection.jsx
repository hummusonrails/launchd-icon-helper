// collapsible section grouping agents by domain
import React, { useState } from 'react'
import AgentItem from './AgentItem'

export default function AgentSection({
  title, domain, agents, expandedAgent,
  onToggle, onExpand, onSave, onRemove, onRefresh,
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="agent-section">
      <div className="section-header" onClick={() => setCollapsed(!collapsed)}>
        <span className={`chevron ${collapsed ? 'collapsed' : ''}`}>&#9662;</span>
        <span className="section-title">{title}</span>
        {domain === 'system-daemons' && <span className="warning-badge" title="system-level services">&#9888;</span>}
        <span className="count-badge">{agents.length}</span>
      </div>
      <div className={`section-body ${collapsed ? 'hidden' : ''}`}>
        {agents.map((agent) => (
          <AgentItem
            key={agent.label}
            agent={agent}
            isExpanded={expandedAgent === agent.label}
            onToggle={onToggle}
            onExpand={onExpand}
            onSave={onSave}
            onRemove={onRemove}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  )
}

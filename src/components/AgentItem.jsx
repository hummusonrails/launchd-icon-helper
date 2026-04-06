// single agent row with status pill, toggle, and expandable detail
import React from 'react'
import DetailPanel from './DetailPanel'

// map status to css class
const statusClass = (s) => {
  if (s === 'running') return 'status-running'
  if (s === 'error') return 'status-error'
  return 'status-stopped'
}

// friendly status label
const statusLabel = (s) => {
  if (s === 'running') return 'Running'
  if (s === 'error') return 'Error'
  return 'Stopped'
}

export default function AgentItem({
  agent, isExpanded, onToggle, onExpand, onSave, onRemove, onRefresh,
}) {
  // toggle switch handler, stop event from expanding
  const handleToggleClick = (e) => {
    e.stopPropagation()
    onToggle(agent.label, agent.domain, !agent.enabled)
  }

  return (
    <div className={`agent-item ${isExpanded ? 'expanded' : ''}`}>
      <div className="agent-row" onClick={() => onExpand(agent.label)}>
        <div className="agent-info">
          {agent.domain !== 'user' && <span className="lock-icon" title="system service">&#x1F512;</span>}
          <span className="agent-name">{agent.displayName}</span>
          <span className={`status-pill ${statusClass(agent.status)}`}>
            {statusLabel(agent.status)}
          </span>
        </div>
        <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={agent.enabled}
            onChange={handleToggleClick}
          />
          <span className="toggle-slider" />
        </label>
      </div>
      {isExpanded && (
        <DetailPanel
          agent={agent}
          onSave={onSave}
          onRemove={onRemove}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}

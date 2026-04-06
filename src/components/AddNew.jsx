// modal form for creating a new launchd agent
import React, { useState } from 'react'

export default function AddNew({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('user')
  const [program, setProgram] = useState('')
  const [mode, setMode] = useState('startup')
  const [intervalValue, setIntervalValue] = useState(5)
  const [intervalUnit, setIntervalUnit] = useState('minutes')
  const [watchPath, setWatchPath] = useState('')
  const [keepAlive, setKeepAlive] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [stdoutPath, setStdoutPath] = useState('')
  const [stderrPath, setStderrPath] = useState('')

  // auto-generate a label from the name
  const generatedLabel = `com.user.${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

  // build config and submit
  const handleCreate = () => {
    if (!name || !program) return
    const config = {
      label: generatedLabel,
      domain,
      program,
      runAtLoad: mode === 'startup',
      keepAlive,
      stdoutPath: stdoutPath || undefined,
      stderrPath: stderrPath || undefined,
    }
    if (mode === 'schedule') {
      config.interval = intervalUnit === 'hours' ? intervalValue * 3600 : intervalValue * 60
    }
    if (mode === 'watch') {
      config.watchPaths = watchPath ? [watchPath] : []
    }
    onSave(config)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">New Agent</h2>

        <div className="form-group">
          <label className="form-label">name</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-task"
          />
          {name && <span className="label-preview">{generatedLabel}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">where</label>
          <select
            className="form-select"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          >
            <option value="user">Just for me</option>
            <option value="system-agents">All users</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">what to run</label>
          <input
            type="text"
            className="form-input"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="/usr/bin/some-command"
          />
        </div>

        <div className="form-group">
          <label className="form-label">when to run</label>
          <select
            className="form-select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="startup">On startup</option>
            <option value="schedule">On a schedule</option>
            <option value="watch">When a file changes</option>
            <option value="manual">Only when needed</option>
          </select>
        </div>

        {mode === 'schedule' && (
          <div className="form-group form-row">
            <label className="form-label">every</label>
            <input
              type="number"
              className="form-input small-input"
              min="1"
              value={intervalValue}
              onChange={(e) => setIntervalValue(Number(e.target.value))}
            />
            <select
              className="form-select small-select"
              value={intervalUnit}
              onChange={(e) => setIntervalUnit(e.target.value)}
            >
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
            </select>
          </div>
        )}

        {mode === 'watch' && (
          <div className="form-group">
            <label className="form-label">watch path</label>
            <input
              type="text"
              className="form-input"
              value={watchPath}
              onChange={(e) => setWatchPath(e.target.value)}
              placeholder="/path/to/watch"
            />
          </div>
        )}

        <div className="form-group form-row">
          <label className="form-label">restart if it stops</label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={keepAlive}
              onChange={(e) => setKeepAlive(e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="form-group">
          <div className="collapsible-header" onClick={() => setShowLogs(!showLogs)}>
            <span className={`chevron small ${showLogs ? '' : 'collapsed'}`}>&#9662;</span>
            <label className="form-label clickable">output logs</label>
          </div>
          {showLogs && (
            <div className="log-fields">
              <input
                type="text"
                className="form-input"
                value={stdoutPath}
                onChange={(e) => setStdoutPath(e.target.value)}
                placeholder="stdout path"
              />
              <input
                type="text"
                className="form-input"
                value={stderrPath}
                onChange={(e) => setStderrPath(e.target.value)}
                placeholder="stderr path"
              />
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!name || !program}
          >
            Create
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

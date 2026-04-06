// expanded detail panel for viewing and editing agent config
import React, { useState, useEffect } from 'react'

// figure out the schedule mode from detail data
function detectMode(detail) {
  if (detail.watchPaths && detail.watchPaths.length > 0) return 'watch'
  if (detail.interval || detail.calendarInterval) return 'schedule'
  if (detail.runAtLoad) return 'startup'
  return 'manual'
}

// parse interval into value and unit
function parseInterval(seconds) {
  if (!seconds) return { value: 5, unit: 'minutes' }
  if (seconds % 3600 === 0) return { value: seconds / 3600, unit: 'hours' }
  return { value: Math.round(seconds / 60), unit: 'minutes' }
}

export default function DetailPanel({ agent, onSave, onRemove, onRefresh }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [program, setProgram] = useState('')
  const [mode, setMode] = useState('startup')
  const [intervalValue, setIntervalValue] = useState(5)
  const [intervalUnit, setIntervalUnit] = useState('minutes')
  const [watchPath, setWatchPath] = useState('')
  const [keepAlive, setKeepAlive] = useState(false)
  const [stdoutPath, setStdoutPath] = useState('')
  const [stderrPath, setStderrPath] = useState('')
  const [showLogs, setShowLogs] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [sudoUnlocked, setSudoUnlocked] = useState(false)

  const isSystem = agent.domain !== 'user'
  const readOnly = isSystem && !sudoUnlocked

  // load full detail on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const d = await window.launchd.getAgentDetail(agent.label, agent.domain)
        if (cancelled) return
        setDetail(d)
        setProgram(d.program || '')
        const m = detectMode(d)
        setMode(m)
        const parsed = parseInterval(d.interval)
        setIntervalValue(parsed.value)
        setIntervalUnit(parsed.unit)
        setWatchPath(d.watchPaths?.[0] || '')
        setKeepAlive(!!d.keepAlive)
        setStdoutPath(d.stdoutPath || '')
        setStderrPath(d.stderrPath || '')
      } catch (err) {
        console.error('failed to load detail', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [agent.label, agent.domain])

  // build config object from form state
  const buildConfig = () => {
    const config = {
      label: agent.label,
      domain: agent.domain,
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
    return config
  }

  // revert form to loaded detail
  const handleRevert = () => {
    if (!detail) return
    setProgram(detail.program || '')
    setMode(detectMode(detail))
    const parsed = parseInterval(detail.interval)
    setIntervalValue(parsed.value)
    setIntervalUnit(parsed.unit)
    setWatchPath(detail.watchPaths?.[0] || '')
    setKeepAlive(!!detail.keepAlive)
    setStdoutPath(detail.stdoutPath || '')
    setStderrPath(detail.stderrPath || '')
  }

  if (loading) return <div className="detail-panel"><div className="loading-spinner small" /></div>

  return (
    <div className="detail-panel">
      {isSystem && !sudoUnlocked && (
        <div className="system-notice" onClick={() => setSudoUnlocked(true)}>
          <span className="lock-icon">&#x1F512;</span> system service - click to unlock editing
        </div>
      )}

      <div className="form-group">
        <label className="form-label">what to run</label>
        <input
          type="text"
          className="form-input"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          readOnly={readOnly}
          placeholder="/usr/bin/some-command"
        />
      </div>

      <div className="form-group">
        <label className="form-label">when to run</label>
        <select
          className="form-select"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          disabled={readOnly}
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
            readOnly={readOnly}
          />
          <select
            className="form-select small-select"
            value={intervalUnit}
            onChange={(e) => setIntervalUnit(e.target.value)}
            disabled={readOnly}
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
            readOnly={readOnly}
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
            disabled={readOnly}
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
              readOnly={readOnly}
              placeholder="stdout path"
            />
            <input
              type="text"
              className="form-input"
              value={stderrPath}
              onChange={(e) => setStderrPath(e.target.value)}
              readOnly={readOnly}
              placeholder="stderr path"
            />
          </div>
        )}
      </div>

      <div className="detail-actions">
        <button
          className="btn btn-primary"
          onClick={() => onSave(buildConfig())}
          disabled={readOnly}
        >
          Save
        </button>
        <button className="btn btn-secondary" onClick={handleRevert}>
          Revert
        </button>
        {!confirmRemove ? (
          <button
            className="btn btn-danger"
            onClick={() => setConfirmRemove(true)}
            disabled={readOnly}
          >
            Remove
          </button>
        ) : (
          <div className="confirm-remove">
            <span>are you sure?</span>
            <button
              className="btn btn-danger"
              onClick={() => onRemove(agent.label, agent.domain)}
            >
              Yes, remove
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setConfirmRemove(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

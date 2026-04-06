// top bar with search input and add button
import React from 'react'

export default function TopBar({ searchQuery, onSearchChange, onAddNew }) {
  return (
    <div className="topbar">
      <div className="search-wrapper">
        <span className="search-icon">&#x1F50D;</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <button className="btn-add" onClick={onAddNew} title="Add new agent">
        +
      </button>
    </div>
  )
}

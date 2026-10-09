import { useState } from 'react'

function JourneyTimeline({ entries }) {
  const [openId, setOpenId] = useState(entries[0]?.id ?? null)

  return (
    <ol className="journey-timeline">
      {entries.map((entry, index) => {
        const isOpen = entry.id === openId
        const panelId = `journey-detail-${entry.id}`

        return (
          <li className={isOpen ? 'is-open' : ''} key={entry.id}>
            <span className="journey-timeline__rail" aria-hidden="true">
              <i />
              <b><span>{String(index + 1).padStart(2, '0')}</span></b>
            </span>
            <div className="journey-timeline__entry">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : entry.id)}
              >
                <span>{entry.marker}</span>
                <div>
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
                </div>
                <i aria-hidden="true">{isOpen ? '×' : '+'}</i>
              </button>
              <div className="journey-timeline__detail" id={panelId} hidden={!isOpen}>
                <p>{entry.detail}</p>
                {entry.placeholder && <span>Editable journey placeholder</span>}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default JourneyTimeline

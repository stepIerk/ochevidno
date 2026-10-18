import { ChevronRight, Clock } from 'lucide-react'
import { materialStats } from '../lib/content.js'
import { materialHref } from '../lib/router.js'
import TypeBadge from './TypeBadge.jsx'

export default function MaterialList({ materials, showSubject = false }) {
  return (
    <ul className="material-list">
      {materials.map((material) => {
        const stats = materialStats(material)
        return (
          <li key={material.id}>
            <a className="material-row" href={materialHref(material.id)}>
              <span className="material-row-main">
                <span className="material-row-title">{material.title}</span>
                <span className="material-row-meta">
                  <TypeBadge type={material.type} />
                  {showSubject && <span className="material-row-subject">{material.subjectName}</span>}
                  <span className="material-row-stat">
                    <Clock size={13} aria-hidden="true" />
                    {stats.minutes} мин
                  </span>
                </span>
              </span>
              <ChevronRight size={16} className="material-row-arrow" aria-hidden="true" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}

import { useMemo, useState } from 'react'
import { ArrowUpRight, FolderOpen } from 'lucide-react'
import { allMaterials, site, subjects, typeLabel } from '../lib/content.js'
import { subjectHref } from '../lib/router.js'
import MaterialList from './MaterialList.jsx'

const ALL = 'all'

function plural(count, one, few, many) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export default function Home() {
  const [filter, setFilter] = useState(ALL)

  const typesPresent = useMemo(() => {
    const seen = []
    for (const material of allMaterials) {
      if (!seen.includes(material.type)) seen.push(material.type)
    }
    return seen
  }, [])

  const groups = useMemo(
    () =>
      subjects
        .map((subject) => ({
          subject,
          items: subject.availableMaterials.filter(
            (material) => filter === ALL || material.type === filter,
          ),
        }))
        .filter((group) => group.items.length > 0),
    [filter],
  )

  return (
    <div className="home">
      <span className="home-theta" aria-hidden="true">Θ</span>
      <section className="hero">
        <h1>{site.title}</h1>
        {site.subtitle && <p className="hero-subtitle">{site.subtitle}</p>}
        <p className="hero-stats">
          {subjects.length} {plural(subjects.length, 'предмет', 'предмета', 'предметов')} ·{' '}
          {allMaterials.length} {plural(allMaterials.length, 'материал', 'материала', 'материалов')} ·{' '}
          поиск <kbd>⌘K</kbd>
        </p>
      </section>

      <section className="subject-grid">
        {subjects.map((subject) => (
          <a key={subject.id} className="subject-card" href={subjectHref(subject.id)}>
            <span className="subject-card-top">
              <FolderOpen size={16} aria-hidden="true" />
              <ArrowUpRight size={16} className="subject-card-arrow" aria-hidden="true" />
            </span>
            <span className="subject-card-name">{subject.name}</span>
            {subject.description && <span className="subject-card-desc">{subject.description}</span>}
            <span className="subject-card-count">
              {subject.availableMaterials.length}{' '}
              {plural(subject.availableMaterials.length, 'материал', 'материала', 'материалов')}
            </span>
          </a>
        ))}
      </section>

      <section className="materials-section">
        <div className="section-head">
          <h2>Все материалы</h2>
          <div className="chip-row" role="group" aria-label="Фильтр по типу материала">
            <button
              type="button"
              className={`chip${filter === ALL ? ' is-active' : ''}`}
              onClick={() => setFilter(ALL)}
            >
              Все
            </button>
            {typesPresent.map((type) => (
              <button
                key={type}
                type="button"
                className={`chip${filter === type ? ' is-active' : ''}`}
                onClick={() => setFilter(type)}
              >
                {typeLabel(type)}
              </button>
            ))}
          </div>
        </div>
        {groups.map(({ subject, items }) => (
          <div className="materials-group" key={subject.id}>
            <h3 className="materials-group-title">
              <a href={subjectHref(subject.id)}>{subject.name}</a>
            </h3>
            <MaterialList materials={items} />
          </div>
        ))}
        {groups.length === 0 && <p className="empty">Материалов пока нет.</p>}
      </section>
    </div>
  )
}

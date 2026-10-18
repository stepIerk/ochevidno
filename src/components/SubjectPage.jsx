import { ArrowLeft } from 'lucide-react'
import MaterialList from './MaterialList.jsx'

export default function SubjectPage({ subject }) {
  return (
    <div className="subject-page">
      <nav className="breadcrumbs" aria-label="Навигация">
        <a href="#/">Главная</a>
        <span className="breadcrumbs-sep">/</span>
        <span className="breadcrumbs-current">{subject.name}</span>
      </nav>
      <header className="subject-head">
        <h1>{subject.name}</h1>
        {subject.description && <p className="subject-head-desc">{subject.description}</p>}
      </header>
      {subject.availableMaterials.length > 0 ? (
        <MaterialList materials={subject.availableMaterials} />
      ) : (
        <p className="empty">В этом предмете пока нет материалов.</p>
      )}
      <a className="back-link" href="#/">
        <ArrowLeft size={14} aria-hidden="true" />
        Ко всем предметам
      </a>
    </div>
  )
}

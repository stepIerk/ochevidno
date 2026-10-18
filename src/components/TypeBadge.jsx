import { typeLabel } from '../lib/content.js'
import { typeIcons } from '../lib/icons.js'

export default function TypeBadge({ type }) {
  const Icon = typeIcons[type] ?? typeIcons.other
  return (
    <span className="badge">
      <Icon size={13} aria-hidden="true" />
      {typeLabel(type)}
    </span>
  )
}

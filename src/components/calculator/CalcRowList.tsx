'use client'

let uidCounter = 0
export const nextCalcId = (prefix: string) => `${prefix}_${Date.now()}_${uidCounter++}`

export interface FieldDef<T> { key: keyof T; label: string }

export function CalcRowList<T extends { id: string }>({
  title, items, onAdd, onRemove, onChange, fields, unit,
}: {
  title: string
  items: T[]
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (id: string, key: keyof T, val: number) => void
  fields: FieldDef<T>[]
  unit: string
}) {
  return (
    <div className="calcw-section">
      <div className="calcw-section-title">{title}</div>
      {items.map(item => (
        <div key={item.id} className="calcw-row">
          {fields.map((f, i) => (
            <span key={String(f.key)} className="calcw-row" style={{ gap: 8 }}>
              {i > 0 && <span className="calcw-x">×</span>}
              <input
                type="number"
                step="0.1"
                value={item[f.key] as unknown as number}
                onChange={e => onChange(item.id, f.key, parseFloat(e.target.value) || 0)}
                title={f.label}
                className="calcw-input calcw-narrow"
              />
            </span>
          ))}
          <span className="calcw-unit">{unit}</span>
          {items.length > 1 && (
            <button onClick={() => onRemove(item.id)} aria-label="Удалить" className="calcw-del">✕</button>
          )}
        </div>
      ))}
      <button onClick={onAdd} className="calcw-add-link">+ добавить</button>
    </div>
  )
}

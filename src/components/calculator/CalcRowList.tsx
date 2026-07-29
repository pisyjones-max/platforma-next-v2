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
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-[var(--muted)]">{title}</div>
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-2">
          {fields.map(f => (
            <input
              key={String(f.key)}
              type="number"
              step="0.1"
              value={item[f.key] as unknown as number}
              onChange={e => onChange(item.id, f.key, parseFloat(e.target.value) || 0)}
              title={f.label}
              className="w-20 px-2 py-1.5 rounded-lg border border-gray-700 bg-[var(--bg)] text-sm outline-none focus:border-gray-500"
            />
          ))}
          <span className="text-xs text-[var(--muted)]">{unit}</span>
          {items.length > 1 && (
            <button onClick={() => onRemove(item.id)}
              className="ml-auto text-xs text-red-400 hover:text-red-300 px-1">✕</button>
          )}
        </div>
      ))}
      <button onClick={onAdd} className="self-start text-xs text-[var(--accent)] hover:underline">
        + добавить
      </button>
    </div>
  )
}

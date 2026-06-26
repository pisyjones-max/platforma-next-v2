import Link from 'next/link'
import { getCatalog } from '@/lib/catalog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Каталог кровельных и фасадных материалов — PLATFORMA',
  description: 'Каталог строительных материалов: кровля, сайдинг, фасад, водостоки, утеплители. Доставка по Московской области. Скидка −17% на всё.',
  alternates: { canonical: '/catalog' },
}

const GROUP_EMOJI: Record<string, string> = {
  krovlya: '🏠',
  sayding: '🏗️',
  'fasadnye-materialy': '🧱',
  vodostoki: '🌧️',
  drenazh: '💧',
  utepliteli: '🌡️',
  'gidro-paro-izolyaciya': '🛡️',
  krovelnie_membrany: '📋',
  profnastil: '🔩',
  metallocherepica: '🏘️',
  'bitumnaya-cherepica': '🔷',
  'kompozitnaya-cherepica': '💎',
  'gibkaya-cherepica': '🔶',
  shtukaturka: '🪣',
  kreplenia: '🔧',
  'dobornye-elementy': '📐',
  'fasadnye-paneli': '🏢',
  'dekorativnye-elementy': '✨',
  'krovelnye-aksessuary': '🔑',
  'vodonagrewateli': '♨️',
}

export default function CatalogPage() {
  const catalog = getCatalog()
  const groups = Object.entries(catalog.groups)

  return (
    <div id="main">
      <nav className="breadcrumb">
        <span className="bc-item bc-cur">Каталог</span>
      </nav>

      <div className="hero">
        <div>
          <h1>Каталог материалов</h1>
          <p>{groups.length} разделов · {catalog.categories.length} категорий · {catalog.meta.total_products} товаров</p>
        </div>
      </div>

      <div className="ggrid">
        {groups.map(([slug, group]) => {
          const catCount = group.categories.length
          const totalProducts = group.categories.reduce((sum, catSlug) => {
            const cat = catalog.categories.find(c => c.slug === catSlug)
            return sum + (cat?.products.length ?? 0)
          }, 0)
          const emoji = GROUP_EMOJI[slug] ?? '📦'

          return (
            <Link key={slug} href={`/catalog/group/${slug}`} className="gcard">
              <div className="gcard-info">
                <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
                <h2 className="gcard-name">{group.name}</h2>
                <p className="gcard-meta">{catCount} категорий · {totalProducts} товаров</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

import React from 'react'

interface CardItem {
  id?: string | number
  title: string
  value: string | number
  subtitle?: string
  // optional icon node to render at right
  icon?: React.ReactNode
  // optional tailwind bg class for icon circle
  iconBg?: string
}

interface Props {
  cards: CardItem[]
}

const getDefaultIcon = (id?: string | number) => {
  const key = String(id ?? '').toLowerCase()
  // Return an SVG appropriate for the card context
  if (key.includes('highest_location')) {
    // map / location pin
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#0ea5a4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="9" r="2.2" fill="#0ea5a4" />
      </svg>
    )
  }

  if (key.includes('person') || key.includes('highest_person')) {
    // user/person icon
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#7c3aed" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="7" r="3" fill="#7c3aed" />
      </svg>
    )
  }

  // default: money/coins icon for totals
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M21 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="1.5" fill="#059669" />
    </svg>
  )
}

const getDefaultBg = (id?: string | number) => {
  const key = String(id ?? '').toLowerCase()
  if (key.includes('highest_location')) return 'bg-cyan-100'
  if (key.includes('person') || key.includes('highest_person')) return 'bg-violet-100'
  return 'bg-green-100'
}

const BonusSummaryCards: React.FC<Props> = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {cards.map((c) => {
        const iconNode = c.icon ?? getDefaultIcon(c.id)
        const iconBgClass = c.iconBg ?? getDefaultBg(c.id)
        return (
          <div key={c.id ?? c.title} className="bg-white dark:bg-[#0e1725] rounded-lg p-4 flex items-center justify-between border border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-300">{c.title}</div>
              <div className="text-2xl font-bold text-black dark:text-white">{c.value}</div>
              {c.subtitle ? <div className="text-xs text-gray-500 mt-1">{c.subtitle}</div> : null}
            </div>

            <div className={`flex items-center justify-center rounded-full p-3 ${iconBgClass}`}>
              <div className="text-current">{iconNode}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default BonusSummaryCards

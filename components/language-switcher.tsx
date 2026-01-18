'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { i18n } from '@/lib/i18n-config'

interface LanguageSwitcherProps {
  currentLang: string
  dict: {
    footer: {
      language: {
        label: string
        languages: {
          en: string
          'zh-CN': string
        }
      }
    }
  }
}

export function LanguageSwitcher({ currentLang, dict }: LanguageSwitcherProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLanguageChange = (newLang: string) => {
    if (!pathname) return
    
    // Replace the language part in the URL
    const segments = pathname.split('/')
    segments[1] = newLang
    const newPath = segments.join('/')
    
    router.push(newPath)
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-400" />
      <select
        value={currentLang}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-gray-800 text-gray-300 text-sm rounded px-2 py-1 border border-gray-700 hover:border-gray-600 focus:outline-none focus:border-coral transition-colors cursor-pointer"
        aria-label={dict.footer.language.label}
      >
        {i18n.locales.map((locale) => (
          <option key={locale} value={locale}>
            {dict.footer.language.languages[locale as keyof typeof dict.footer.language.languages]}
          </option>
        ))}
      </select>
    </div>
  )
}

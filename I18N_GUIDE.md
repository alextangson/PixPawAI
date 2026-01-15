# Internationalization (i18n) Implementation Guide

## Overview

PixPaw AI now supports internationalization using Next.js 15 App Router with automatic locale detection and SEO-optimized routing.

## Current Languages

- **English (en)** - Default locale

## Project Structure

```
/app
  └── [lang]/              # Dynamic route for all languages
      ├── layout.tsx       # Root layout with i18n metadata
      └── page.tsx         # Home page with translations

/lib
  ├── i18n-config.ts       # i18n configuration
  ├── dictionary.ts        # Dictionary loader
  └── dictionaries/
      └── en.json          # English translations

middleware.ts              # Locale detection & redirection
```

## How It Works

### 1. Middleware (Auto-Detection)

The middleware automatically:
- Detects user's preferred language from browser headers
- Redirects `/` → `/en` (or user's preferred locale)
- Uses `negotiator` and `@formatjs/intl-localematcher` for smart locale matching

### 2. Dynamic Routes

All pages are under `/app/[lang]/`:
- `/en` → English version
- Future: `/es`, `/fr`, `/zh`, etc.

### 3. Dictionary System

Translations are stored in JSON files:

```json
// lib/dictionaries/en.json
{
  "hero": {
    "badge": "Powered by AI Magic",
    "title": {
      "part1": "Turn Your Pet Into a",
      "part2": "Pixar Star"
    },
    "subtitle": "Transform your furry friend...",
    "cta": {
      "primary": "Try Now for Free",
      "secondary": "See Examples"
    }
  },
  "metadata": {
    "title": "PixPaw AI - Turn Your Pet Into a Pixar Star",
    "description": "Transform your furry friend..."
  }
}
```

### 4. Server Components

Pages and layouts are async and fetch dictionaries server-side:

```typescript
// app/[lang]/page.tsx
export default async function Home({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  
  return <HeroSection dict={dict} />
}
```

## Adding a New Language

### Step 1: Update Config

```typescript
// lib/i18n-config.ts
export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'fr'], // Add new locales here
} as const
```

### Step 2: Create Translation File

```bash
# Create new dictionary
cp lib/dictionaries/en.json lib/dictionaries/es.json
```

Edit the new file with translations:

```json
// lib/dictionaries/es.json
{
  "hero": {
    "badge": "Impulsado por IA Mágica",
    "title": {
      "part1": "Convierte a tu Mascota en una",
      "part2": "Estrella de Pixar"
    },
    ...
  }
}
```

### Step 3: Register in Dictionary Loader

```typescript
// lib/dictionary.ts
const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  es: () => import('./dictionaries/es.json').then((module) => module.default),
  fr: () => import('./dictionaries/fr.json').then((module) => module.default),
}
```

### Step 4: Deploy

The new language will automatically:
- Be detected by middleware
- Generate static pages at build time
- Have proper SEO metadata in the target language

## SEO Benefits

✅ **Proper HTML `lang` attribute** per locale
✅ **Dynamic metadata** (title, description, OG tags) in each language
✅ **Server-side rendering** for full indexability
✅ **Clean URLs**: `/en/`, `/es/`, not `/en-US/`
✅ **Automatic hreflang** (can be extended)

## API Routes & i18n

For API routes that need translations:

```typescript
// app/api/generate/route.ts
import { getDictionary } from '@/lib/dictionary'

export async function POST(request: Request) {
  const { lang } = await request.json()
  const dict = await getDictionary(lang)
  
  // Use dict.apiMessages.generatingImage, etc.
}
```

## Testing

### Manual Testing

1. Visit `http://localhost:3000` → should redirect to `/en`
2. Visit `http://localhost:3000/en` directly
3. Change browser language and visit root → should detect and redirect

### URL Structure

- ❌ Bad: `/products`, `/about`
- ✅ Good: `/en/products`, `/en/about`

## Performance

- Dictionaries are **imported dynamically** (code-splitting)
- Only the requested locale's JSON is loaded
- Translations are **cached** by Next.js
- Static generation at build time for all locales

## Common Patterns

### Client Components

If a client component needs translations, pass them as props from a Server Component:

```typescript
// app/[lang]/page.tsx (Server Component)
export default async function Page({ params }) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  
  return <ClientComponent translations={dict.clientSection} />
}
```

### Dynamic Metadata

```typescript
// app/[lang]/layout.tsx
export async function generateMetadata({ params }) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  
  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
    openGraph: {
      locale: lang === 'en' ? 'en_US' : lang,
      ...
    },
  }
}
```

## Future Enhancements

- [ ] Add language switcher component
- [ ] Implement `hreflang` tags for alternate languages
- [ ] Add RTL support for Arabic/Hebrew
- [ ] Create translation management system
- [ ] Add missing translation detection

## Troubleshooting

### Middleware not redirecting

Check `middleware.ts` matcher config:
```typescript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
```

### Params error in Next.js 15

Always await params:
```typescript
// ❌ Wrong
function Page({ params }: { params: { lang: Locale } }) {
  const lang = params.lang
}

// ✅ Correct
async function Page({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params
}
```

### Dictionary not found

Ensure the locale exists in both:
1. `i18n-config.ts` locales array
2. `lib/dictionaries/` folder with matching filename
3. `dictionary.ts` imports

---

**Need help?** Check the [Next.js i18n docs](https://next-intl-docs.vercel.app/) or review our implementation in `/app/[lang]/`.

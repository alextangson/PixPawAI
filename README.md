# PixPaw AI

Transform your pet into a Pixar star in 30 seconds! ✨

## Features

- 🎨 AI-powered 3D Pixar-style transformations
- 📱 Mobile-first responsive design
- 💳 Digital downloads ($2.99 for 4K)
- 🛍️ Physical merchandise upsells (custom pillows)
- 🔒 Secure payments with LemonSqueezy
- ⚡ Built with Next.js 15 + Tailwind CSS

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + Shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **AI:** Replicate API (Flux-schnell / SDXL)
- **Payments:** LemonSqueezy
- **Deployment:** Vercel

## Project Structure

```
/app                  # Next.js 15 App Router pages
/components           # React components
  /ui                 # Shadcn/ui components
/lib                  # Utility functions
/public               # Static assets
```

## Development Guidelines

- Mobile-first responsive design
- Server-side rendering for SEO
- TypeScript strict mode
- One H1 per page
- Semantic HTML structure

## Deployment

```bash
npm run build
```

Deploy to Vercel with one click or use:

```bash
vercel
```

## License

Proprietary - PixPaw AI © 2026

# PixPaw Frontend Architecture & Technical Spec (V1.0)

**Project:** PixPaw AI (SaaS + E-commerce) **Status:** Frontend Complete (MVP) / Backend Pending **Last Updated:** January 2026

---

## 1. 🏗️ Tech Stack & Environment

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (Dialog, Button, Input), Lucide React (Icons)
- **State Management:** React Hooks (useState for local UI states)

---

## 2. 🗺️ Sitemap & Core Pages

### A. Landing Page (`app/page.tsx`)

- **Goal:** Conversion (Click "Create Now").
- **Key Sections:**
  - **Hero:** Strong H1, "Create Now" CTA (Triggers Upload Flow).
  - **Style Showcase:** 8 curated styles in a Masonry layout.
  - **Features/Benefits:** Why choose us (High Res, Privacy).
  - **Testimonials:** Social proof.
  - **Footer:** Links to sub-pages.

### B. Gallery Page (`app/gallery/page.tsx`)

- **Goal:** Inspiration & "Remix" Funnel.
- **Layout:**
  - **Top Bar:** Sticky Search Bar + Scrollable Filter Chips (Emoji + Text).
  - **Grid:** Masonry Layout (Pinterest style), clean images (no text overlays).
- **Interaction (The Modal):**
  - **Trigger:** Click on any image.
  - **Component:** `DialogContent` (Max-width: 5XL, Split View).
  - **Left Column:** Full-bleed High-Res Image.
  - **Right Column:** Style Name, Tags, Description, and **"Remix this Style 🪄"** button.
- **Data Structure (Frontend Mock):**
TypeScript
  ```
  interface GalleryItem {
    id: string;
    src: string;
    styleName: string; // e.g., "3D Disney"
    species: 'dog' | 'cat' | 'rabbit' | 'bird' | 'reptile' | 'other';
    tags: string[]; // e.g., ["Cute", "Lighting"]
    promptTemplate: string; // Hidden field for backend usage
  }

  ```

### C. Pricing Page (`app/pricing/page.tsx`)

- **Goal:** Segmentation & Upsell.
- **Structure:** 1+3 Model.
  - **Free Trial:** $0, 2 Credits, Watermarked, Standard Queue.
  - **Starter:** $4.90, 15 Credits.
  - **Pro Bundle (Highlight):** $9.90, 50 Credits + **$5 Merch Credit**.
- **Referral Section:** "Invite friend, get 5 credits" (Visual placeholder).

### D. How-to Guide (`app/how-to/page.tsx`)

- **Goal:** Education & SEO.
- **Content:**
  - **Featured:** "Golden Rule of Uploading" (Bad vs Good photo).
  - **Grid:** Articles on Styles, Printing, Prompting.

### E. Navigation (`components/Navbar.tsx`)

- **Links:** Gallery, How-to Guide, Pricing.
- **Actions:**
  - `Log In` (Text Link) -> Will connect to Supabase Auth.
  - `Create Now` (Primary Button) -> Triggers Upload Modal.

---

## 3. 🔌 Integration Points (Frontend -> Backend Bridge)

This section defines where Supabase needs to be "plugged in".

### 1. Authentication (Supabase Auth)

- **Location:** Navbar "Log In" & "Create Now" (if not logged in).
- **Requirement:** Google OAuth & Email Magic Link.
- **Logic:**
  - If user is Guest -> Show "Log In".
  - If user is Logged In -> Show Avatar/Dropdown.

### 2. Gallery Data (Supabase DB)

- **Current State:** `MOCK_DATA` array in `app/gallery/page.tsx`.
- **Future State:** Fetch from table `public.gallery_images`.
- **Query Logic:**
  - Filter by `species` (matches Filter Chips).
  - Filter by `tags` (matches Search Bar).
  - Pagination (Infinite Scroll).

### 3. The "Remix" Action (Critical)

- **Location:** Gallery Modal -> "Remix this Style" Button.
- **Logic:**
  - Currently: Button is static.
  - Future: `onClick` -> Redirect to `/upload?style_id={id}&prompt={encoded_prompt}`.
  - **Backend Need:** The database must store the `prompt_template` for every gallery image so we can pass it to the generator.

### 4. Pricing & Credits (Stripe + Supabase)

- **Location:** Pricing Page buttons.
- **Logic:**
  - Click "Get Pro" -> Trigger Stripe Checkout.
  - Webhook -> Update User's `credits` column in Supabase.

---

## 4. 🎨 Design System & Assets

- **Colors:**
  - Primary: Orange `#FF8C42` (Buttons, Highlights).
  - Background: Cream `#FFFDF9`.
  - Text: Dark Gray `#1F2937`.
- **Typography:** Sans-serif (Geist/Inter).
- **Components:** All basic UI elements (Buttons, Cards, Dialogs) are built using `shadcn/ui` in the `components/ui` folder.

---

## 5. 🔜 Next Steps (Backend Roadmap)

1. **Initialize Supabase:** Create Project & Tables (`users`, `generations`, `gallery`).
2. **Auth Implementation:** Replace Navbar "Log In" with real Auth logic.
3. **Database Connection:** Replace Gallery `MOCK_DATA` with `supabase.from('gallery').select('*')`.
4. **Storage:** Set up buckets for User Uploads and AI Results.


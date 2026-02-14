Here is the **English version** of the "Architecture Blueprint".

Save this as `docs/gallery-spec.md`. It is written in standard technical language that Cursor (and any future developer) will understand immediately.

---

# 📂 PixPaw Gallery Module Design & Backend Integration Spec

Version: V1.0

Status: Frontend Designed / Backend Pending

Goal: To implement a high-conversion gallery combining "Inspiration Browsing (Pinterest)," "One-Click Remix," and "Merchandise Preview."

---

## 1. Core Interaction Logic (Frontend)

### A. The Feed (Masonry Layout)

- **Layout:** Masonry Layout (Pinterest-style staggered grid).
- **Interactions:**
  - **Default:** Displays the Image + Style Label.
  - **Hover:** Reveals a **"Use Style 🪄"** button.
  - **Click:** Does **NOT** navigate away; instead, it opens the **Detail Modal**.

### B. The Detail Modal

- **Left Side (Visual):** High-Resolution Image + SEO Alt Text.
- **Right Side (Action):**
  - **Primary Button ("Remix this Style"):** Redirects the user to the Upload Flow, **auto-filling** the parameters.
  - **Merch Preview ("Shop the Look"):** Shows a live preview of this specific image mocked up on Pillows, Mugs, etc.

---

## 2. Database Schema Requirements

*When creating the* `gallery_images` *table in Supabase later, the following fields are required to support frontend features:*


|                   |          |                                         |                                                                       |
| ----------------- | -------- | --------------------------------------- | --------------------------------------------------------------------- |
| **Field Name**    | **Type** | **Purpose**                             | **Frontend Component**                                                |
| `id`              | UUID     | Unique Identifier                       | Used for Deep Linking URLs (`/gallery/[id]`)                          |
| `image_url`       | String   | Storage URL                             | Masonry Card / Modal Hero Image                                       |
| `alt_text`        | String   | **SEO Critical** (e.g., "stylized dog portrait") | Image `alt` attribute for Google Indexing                             |
| `prompt_template` | Text     | The raw prompt used to gen this image   | **Core of "Remix"**. AI fills this template when user clicks "Create" |
| `style_category`  | String   | Style Category (e.g., `Pop Art`, `Oil`) | Top Filter Chips                                                      |
| `tags`            | Array    | Tags (e.g., `['dog', 'corgi', 'cute']`) | Search Bar                                                            |
| `is_public`       | Boolean  | Public Visibility                       | Distinguishes private user generations from public gallery            |
| `author_id`       | UUID     | Author ID                               | (Optional) To display "Created by User123"                            |


---

## 3. Key Integration Points (Connecting Dots)

*These are the logic bridges between the UI (Frontend) and the Logic (Backend).*

### Point 1: The Remix Flow (One-Click Creation)

- **Frontend Action:** User clicks "Remix this Style" in the modal.
- **Data Transfer:** Router pushes to the upload page with parameters.
  - `router.push('/upload?source_id=123&style=stylized-portrait')`
- **Logic Response:**
  - The Upload Page reads the `source_id` from the URL.
  - It fetches the `prompt_template` associated with that ID.
  - **Result:** The user lands on the upload page, and the "Style" is already selected, and the "Prompt" is pre-filled. They just need to upload a photo.

### Point 2: Deep Linking (SEO)

- **Frontend Action:** User accesses `pixpaw.ai/gallery?id=123` directly.
- **Logic Response:**
  - The page detects the `id` query parameter on load.
  - It automatically opens the **Detail Modal** for image #123.
  - **SSR:** Server-Side Rendering injects the `alt_text` into the page Meta tags for crawlers.

### Point 3: Merch Preview (Frontend Rendering)

- **Frontend Action:** The modal shows the image on a pillow.
- **Logic Response:**
  - Use CSS `mask-image` or `mix-blend-mode` to overlay the `image_url` (the dog) onto the `merch_mockup.png` (the white pillow) dynamically.
  - **Note:** No need to generate a new physical image file on the backend yet (saves GPU costs).

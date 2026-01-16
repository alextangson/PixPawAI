# 🎯 Quick Reference: Button Layouts
**For Developers & Designers**

---

## 📱 Result Modal (After Generation)

### Layout

```
LEFT PANEL (58%)                RIGHT PANEL (42%)
═════════════                   ═════════════

[Generated Image Display]       "Your Portrait is Ready"

                                [Wall Art Mockup]
                                ↑ Clickable → Shop

──────────────────────          "Visualize in your home"
ACTION BAR (3 Buttons):
                                [Explore Products]
┌────────────────────────┐
│ 1. Share to Gallery    │     ✓ Premium quality
│    (+1 Credit)          │     ✓ Fast shipping
│    [FULL WIDTH]         │     ✓ Money-back guarantee
└────────────────────────┘

┌─────────────┬──────────┐
│ 2. Download ▼│ 3. Shop  │
│  • Original  │          │
│  • Art Card  │          │
└─────────────┴──────────┘

Credits: X remaining
```

---

## 📸 Gallery Tab (My Dashboard)

### Card Layout

```
┌─────────────────────────────────────────┐
│  🖼️  [Image]                    [🗑️]   │ ← Delete (hover)
│                                         │
│  📅 Date            [✅ Shared] Badge   │
│  👁️ 234  ❤️ 56                          │ ← Stats (if public)
│                                         │
│  ──────────────────────────────────     │
│  PERMANENT 3-BUTTON LAYOUT:             │
│  ═════════════════════════              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ [Download ▼] [Status ▼] [Shop]   │ │
│  │   (Always)    (Toggle)   (Always)│ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔘 Button Specifications

### Button 1: Download (TOOLS)

**Style:**
```css
variant: outline
className: flex-1
icon: Download (w-4 h-4)
```

**Dropdown Menu:**
```
[Download ▼]
  ├─ ⬇️ Original Image     (Direct download)
  └─ ✨ Create Art Card    (Opens ArtCardModal)
```

**States:**
- Default: Gray outline
- Hover: Light gray background
- Always enabled ✅

**Code:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button size="sm" variant="outline" className="flex-1">
      <Download className="w-4 h-4 mr-1" />
      Download
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={downloadOriginal}>
      <Download className="w-4 h-4 mr-2" />
      Original Image
    </DropdownMenuItem>
    <DropdownMenuItem onClick={createArtCard}>
      <Sparkles className="w-4 h-4 mr-2" />
      Create Art Card
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Button 2: Status (TOGGLE)

#### State A: Private (Not Shared)

**Style:**
```css
variant: outline
className: flex-1 border-coral/30 hover:bg-coral/10 text-coral
icon: Share2 (w-4 h-4)
```

**Action:** Click → Opens share dialog

**Code:**
```tsx
<Button
  size="sm"
  variant="outline"
  className="flex-1 border-coral/30 hover:bg-coral/10 text-coral"
  onClick={handleShareClick}
>
  <Share2 className="w-4 h-4 mr-1" />
  Share
</Button>
```

---

#### State B: Public (Shared)

**Style:**
```css
variant: outline
className: flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100
icon: CheckCircle (w-4 h-4)
```

**Dropdown Menu:**
```
[Shared ▼]
  ├─ 📊 View Analytics     (Opens analytics modal)
  ├─ ──────────────────
  └─ 👁️ Make Private      (Calls unshare API)
```

**Code:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      size="sm"
      variant="outline"
      className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
    >
      <CheckCircle className="w-4 h-4 mr-1" />
      Shared
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={viewAnalytics}>
      <BarChart3 className="w-4 h-4 mr-2" />
      View Analytics
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={makePrivate}>
      <EyeOff className="w-4 h-4 mr-2" />
      Make Private
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Button 3: Shop (COMMERCE)

**Style:**
```css
variant: outline
className: flex-1 border-coral/20 hover:bg-coral/5
icon: ShoppingBag (w-4 h-4)
```

**Action:** Click → Redirect to `/shop/{generation.id}`

**States:**
- Default: Gray outline with coral tint
- Hover: Subtle coral background
- Always enabled ✅

**Code:**
```tsx
<Button
  size="sm"
  variant="outline"
  className="flex-1 border-coral/20 hover:bg-coral/5"
  onClick={() => window.location.href = `/shop/${generation.id}`}
>
  <ShoppingBag className="w-4 h-4 mr-1" />
  Shop
</Button>
```

---

## 🎨 Color Palette Reference

### Button Colors

| State | Background | Border | Text | Hover |
|-------|-----------|--------|------|-------|
| **Default** | white | gray-200 | gray-700 | gray-50 |
| **Primary (Share)** | coral gradient | coral | white | darker gradient |
| **Success (Shared)** | green-50 | green-200 | green-700 | green-100 |
| **Shop (Subtle)** | white | coral/20 | gray-700 | coral/5 |

### Icon Colors

| Icon | Color | Context |
|------|-------|---------|
| Download | gray-600 | Default |
| Share2 | coral | Private state |
| CheckCircle | green-700 | Public state |
| ShoppingBag | gray-600 | Default |
| Sparkles | coral | Premium feature |
| BarChart3 | coral | Analytics |
| Eye | blue-600 | View count |
| Heart | pink-600 | Like count |
| Trash2 | red-600 | Delete |

---

## 📐 Spacing & Sizing

### Button Dimensions

```css
Height:    h-11 (44px)    ← Touch-friendly
Padding:   px-4 py-2      ← Comfortable
Gap:       gap-2 (8px)    ← Visual breathing room
Icon Size: w-4 h-4 (16px) ← Readable
```

### Responsive Breakpoints

```css
Mobile (<768px):
  - Full-width buttons (w-full)
  - Stacked layout (flex-col)
  - Larger touch targets

Tablet (768px - 1023px):
  - 2-button rows (grid-cols-2)
  - Medium padding (p-4)

Desktop (≥1024px):
  - 3-button row (flex-row gap-2)
  - Ample padding (p-6)
  - Hover effects enabled
```

---

## 🎭 Visual States

### Download Button

```
Default:              Hover:               Open:
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ ⬇️ Download │  →   │ ⬇️ Download │  →   │ ⬇️ Download │
│             │      │ (bg-gray)   │      │      ▼     │
└─────────────┘      └─────────────┘      └─────────────┘
                                                  ↓
                                           ┌──────────────┐
                                           │ Original     │
                                           │ ────────     │
                                           │ ✨ Art Card  │
                                           └──────────────┘
```

---

### Share/Shared Button

```
PRIVATE STATE:        HOVER:              CLICK:
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│ 🔗 Share    │  →   │ 🔗 Share    │  →   │ Share Dialog │
│  (coral)    │      │ (coral bg)  │      │ + Title Input│
└─────────────┘      └─────────────┘      └──────────────┘

PUBLIC STATE:         HOVER:              CLICK:
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ ✅ Shared   │  →   │ ✅ Shared   │  →   │ ✅ Shared   │
│  (green)    │      │ (lighter)   │      │      ▼     │
└─────────────┘      └─────────────┘      └─────────────┘
                                                  ↓
                                           ┌──────────────┐
                                           │ 📊 Analytics │
                                           │ ────────     │
                                           │ 👁️ Private   │
                                           └──────────────┘
```

---

### Shop Button

```
Default:              Hover:              Click:
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ 🛍️ Shop     │  →   │ 🛍️ Shop     │  →   │ Redirecting │
│  (outline)  │      │ (coral tint)│      │ to /shop... │
└─────────────┘      └─────────────┘      └─────────────┘
```

---

## 🧩 Component Integration

### Modals Used

**ArtCardModal:**
- Triggered by: Download dropdown → "Create Art Card"
- Purpose: Edit title, refresh slogan, preview, download
- Props: `generationId`, `imageUrl`, `originalTitle`

**ShareSuccessModal:**
- Triggered by: Share flow success
- Purpose: Show branded card, allow download, link to gallery
- Props: `shareCardUrl`, `slogan`, `generationId`

**Analytics Modal:**
- Triggered by: Shared dropdown → "View Analytics"
- Purpose: Show views, likes, share date
- Props: `generation` object (inline, not separate component)

---

## 💻 Code Snippets

### Import Statement

```typescript
import {
  Download,
  Share2,
  CheckCircle,
  ShoppingBag,
  Sparkles,
  BarChart3,
  Eye,
  Heart,
  EyeOff,
  Trash2
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
```

---

### Complete Button Set (Copy-Paste Ready)

```tsx
{/* PERMANENT 3-BUTTON LAYOUT */}
<div className="flex gap-2">
  
  {/* Button 1: Download */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button size="sm" variant="outline" className="flex-1">
        <Download className="w-4 h-4 mr-1" />
        Download
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={downloadOriginal}>
        <Download className="w-4 h-4 mr-2" />
        Original Image
      </DropdownMenuItem>
      <DropdownMenuItem onClick={createArtCard}>
        <Sparkles className="w-4 h-4 mr-2" />
        Create Art Card
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  {/* Button 2: Status (Toggle) */}
  {!generation.is_public ? (
    <Button
      size="sm"
      variant="outline"
      className="flex-1 border-coral/30 hover:bg-coral/10 text-coral"
      onClick={handleShareClick}
    >
      <Share2 className="w-4 h-4 mr-1" />
      Share
    </Button>
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Shared
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={viewAnalytics}>
          <BarChart3 className="w-4 h-4 mr-2" />
          View Analytics
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={makePrivate}>
          <EyeOff className="w-4 h-4 mr-2" />
          Make Private
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )}

  {/* Button 3: Shop */}
  <Button
    size="sm"
    variant="outline"
    className="flex-1 border-coral/20 hover:bg-coral/5"
    onClick={() => window.location.href = `/shop/${generation.id}`}
  >
    <ShoppingBag className="w-4 h-4 mr-1" />
    Shop
  </Button>
</div>
```

---

## 🎨 Tailwind Classes Quick Reference

### Button Variants

```css
/* Primary Action (Share when private) */
bg-gradient-to-r from-coral to-orange-600
hover:from-orange-600 hover:to-coral
text-white

/* Success State (Shared) */
bg-green-50
border-green-200
text-green-700
hover:bg-green-100

/* Neutral Tool (Download) */
variant="outline"
border-gray-200
hover:bg-gray-50

/* Commerce Subtle (Shop) */
variant="outline"
border-coral/20
hover:bg-coral/5
```

---

## 📋 Developer Checklist

When implementing buttons:

- [ ] Import all required icons from lucide-react
- [ ] Use `size="sm"` for compact layout
- [ ] Add `className="flex-1"` for equal width distribution
- [ ] Include icons with `className="w-4 h-4 mr-1"`
- [ ] Align dropdown content: `align="start"` or `align="end"`
- [ ] Test all states (private, public, processing, failed)
- [ ] Verify mobile responsive (44px+ touch targets)
- [ ] Check accessibility (keyboard navigation)

---

## 🧪 Test Cases

### Manual Testing

```
✓ Download dropdown works on private image
✓ Download dropdown works on public image
✓ Art Card opens editor (not just download)
✓ Share button opens dialog with input
✓ Share success changes button to "Shared"
✓ Shared dropdown shows analytics option
✓ Analytics modal displays correct stats
✓ Make Private calls unshare API
✓ Shop button redirects correctly
✓ Delete button shows confirmation
```

---

## 🎯 Priority Matrix

| Button | Priority | Always Visible | Disabled States |
|--------|----------|----------------|-----------------|
| **Download** | Primary | ✅ YES | ❌ NEVER |
| **Status** | Primary | ✅ YES | ❌ NEVER |
| **Shop** | Secondary | ✅ YES | ❌ NEVER |
| **Delete** | Tertiary | Hover Only | ❌ NEVER |

**Philosophy:** Never disable core functionality

---

## 🎨 Design Tokens

### Colors (Hex)

```
--coral:       #FF8C42
--orange-600:  #EA580C
--green-50:    #F0FDF4
--green-200:   #BBF7D0
--green-700:   #15803D
--gray-50:     #F9FAFB
--gray-200:    #E5E7EB
--gray-600:    #4B5563
```

### Spacing

```
gap-2:    0.5rem  (8px)
p-4:      1rem    (16px)
h-11:     2.75rem (44px)
```

### Border Radius

```
rounded-lg:   0.5rem  (8px)
rounded-xl:   0.75rem (12px)
rounded-2xl:  1rem    (16px)
```

---

## 🔄 State Flow Diagram

```
Private Image
     ↓
[Share] Button
     ↓
   Click
     ↓
Share Dialog
     ↓
  Submit
     ↓
API: /api/share
     ↓
  Success
     ↓
Button becomes [Shared ▼]
     ↓
   Click
     ↓
Dropdown Menu:
├─ View Analytics → Analytics Modal
└─ Make Private → API: /api/unshare
                      ↓
                    Success
                      ↓
            Button becomes [Share]
```

---

## 📱 Responsive Grid

### Desktop (≥1024px)

```
┌─────────────────────────────────────┐
│  Grid: 3 columns                    │
├───────────┬───────────┬─────────────┤
│  Card 1   │  Card 2   │  Card 3     │
│  [3 btns] │  [3 btns] │  [3 btns]   │
└───────────┴───────────┴─────────────┘
```

### Tablet (768px - 1023px)

```
┌─────────────────────────┐
│  Grid: 2 columns        │
├─────────────┬───────────┤
│  Card 1     │  Card 2   │
│  [3 btns]   │  [3 btns] │
└─────────────┴───────────┘
```

### Mobile (<768px)

```
┌─────────────┐
│  Grid: 1 col│
├─────────────┤
│  Card 1     │
│  [3 btns]   │
├─────────────┤
│  Card 2     │
│  [3 btns]   │
└─────────────┘
```

---

## ✅ Acceptance Criteria

### Functionality

- [x] All buttons functional in all states
- [x] Dropdowns work on click/touch
- [x] Analytics modal shows correct data
- [x] Share flow grants +1 credit
- [x] Unshare removes from gallery
- [x] Art Card opens editor
- [x] Shop redirects correctly

### Design

- [x] Colors match brand (coral, green, gray)
- [x] Icons from lucide-react only
- [x] Consistent spacing (8px gaps)
- [x] Professional typography
- [x] Mobile responsive
- [x] Hover states smooth

### Technical

- [x] No linting errors
- [x] TypeScript compliant
- [x] No console errors
- [x] Performant (no lag)
- [x] Accessible (keyboard nav)

---

**Quick Reference Status:** ✅ COMPLETE  
**Last Updated:** January 16, 2026  
**Maintained By:** Development Team

---

*Copy-paste this into your design system documentation*  
*Use as reference for new features*  
*Share with new team members*

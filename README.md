# Vello Tech

Premium e-commerce store for tech gadgets and electronics — built with modern web technologies. A performant, accessible, and beautiful shopping experience with full auth, checkout, and dashboard.

![Vello Tech](public/next.svg)

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Runtime** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) (60+ components) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Auth** | [Supabase Auth](https://supabase.com/auth) (email/password + OAuth) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Analytics** | [Vercel Analytics](https://vercel.com/analytics) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) |
| **Package Manager** | npm |

## Features

### Storefront
- **Hero slider** — full-screen carousel with animated transitions, stats bar
- **Featured products** — filterable grid (All, New, Sale, Best Seller, Popular)
- **Category navigation** — 6 product categories with icon grid
- **Promo section** — countdown timer, sale highlights
- **Customer testimonials** — star ratings, review cards
- **Newsletter signup** — email subscription form
- **Features bar** — free shipping, secure payments, support, returns

### Shopping Experience
- **Shopping cart** — quantity controls, promo codes, order summary
- **Checkout** — 3-step flow (Shipping → Payment → Review)
- **Guest or login checkout** — toggle between quick guest checkout or sign in
- **Payment success page** — order confirmation, receipt, tracking info

### User Account
- **Dashboard** — profile header, stats cards, quick links, recent orders
- **Order history** — searchable, filterable by status (Delivered, Shipped, Processing, Cancelled)
- **Wishlist** — save favorite products, add to cart, out-of-stock badges
- **Auth pages** — login, register with password requirements, email verification

### API Routes
- `POST /api/checkout` — checkout endpoint (Stripe-ready)
- `POST /api/email` — newsletter subscription endpoint

### Design System
- Full shadcn/ui component library (60+ components)
- CSS custom properties for light/dark theme
- Tailwind v4 with `tw-animate-css` animations
- Responsive design (mobile, tablet, desktop)
- Subtle, soft borders for premium aesthetic

## Project Structure

```
vello-tech/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Homepage
│   ├── layout.tsx          # Root layout (fonts, metadata, analytics)
│   ├── globals.css         # Global styles & theme variables
│   ├── cart/               # Shopping cart page
│   ├── checkout/           # Checkout flow + success page
│   ├── account/            # User dashboard + order history
│   ├── wishlist/           # Wishlist page
│   ├── auth/               # Auth pages (login, register, verify, callback)
│   └── api/                # API routes (checkout, email)
├── components/
│   ├── ui/                 # shadcn/ui components (60+)
│   ├── header.tsx          # Site header with navigation
│   ├── hero.tsx            # Hero slider
│   ├── featured-products.tsx
│   ├── categories.tsx
│   ├── features.tsx
│   ├── testimonials.tsx
│   ├── newsletter.tsx
│   ├── promo-section.tsx
│   └── footer.tsx
├── lib/
│   ├── utils.ts            # Utility functions (cn)
│   └── supabase/
│       ├── client.ts       # Browser Supabase client
│       └── server.ts       # Server Supabase client
├── public/                 # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── .env.local              # Environment variables (gitignored)
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/vello-tech.git
cd vello-tech

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following:

```env
# Supabase (required for auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Dev redirect for Supabase email auth
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Authentication → Settings**:
   - Set **Site URL** to `http://localhost:3000`
   - Add `http://localhost:3000/auth/callback` to **Redirect URLs**
3. Copy your project URL and anon key from **Settings → API** into `.env.local`
4. (Optional) Run this SQL in the SQL Editor to auto-create user profiles:

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

The easiest way to deploy is on [Vercel](https://vercel.com/):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Or deploy manually:

```bash
npm run build
npm run start
```

## License

MIT © Vello Tech
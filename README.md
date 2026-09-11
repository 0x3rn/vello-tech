# Vello Tech

Premium e-commerce store for tech gadgets and electronics. Built with modern web technologies. A performant, accessible, and beautiful shopping experience with full authentication, checkout, and an admin dashboard.

![Vello Tech](public/next.svg)

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Runtime** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) |
| **State Management**| [Zustand](https://zustand-demo.pmnd.rs/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Auth** | [Firebase Authentication](https://firebase.google.com/products/auth) |
| **Database** | [Neon Postgres](https://neon.tech/) with [Drizzle ORM](https://orm.drizzle.team/) |
| **Object storage** | Neon Object Storage (S3-compatible) |
| **Deployment** | Vercel (native Next.js) or Cloudflare Workers (vinext) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |

## Features

### Storefront
- **Hero slider** - full-screen carousel with animated transitions
- **Featured products** - filterable grid with dynamic layout animations
- **Category navigation** - comprehensive product categories with icon grid
- **Promo section** - countdown timer and sale highlights
- **Customer testimonials** - star ratings and review cards
- **Features bar** - free shipping, secure payments, support, returns

### Shopping Experience
- **Shopping cart** - quantity controls, local persistence, order summary
- **Checkout** - multi-step checkout flow
- **Search & Filters** - fully functional product search and filtering system

### User Account & Admin
- **Admin Dashboard** - manage products, track inventory, view statistics
- **User Dashboard** - profile management, order history tracking
- **Wishlist** - save favorite products to a personalized list
- **Authentication** - secure login and registration using Firebase Auth

## Project Structure

```text
vello-tech/
├── app/                    # Next.js App Router
│   ├── (store)/            # Main storefront routes
│   ├── (admin)/            # Admin dashboard routes
│   ├── auth/               # Authentication pages
│   ├── api/                # Neon-backed API route handlers
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── admin/              # Admin-specific components
│   └── ...                 # Storefront components
├── lib/
│   ├── contexts/           # React contexts (e.g., AuthContext)
│   ├── store/              # Zustand state stores
│   ├── firebase.ts         # Firebase client authentication
│   ├── firebase-admin.ts   # Node/Workers server authentication adapter
│   ├── neon/               # Neon data-access and auth helpers
│   └── utils.ts            # Utility functions
├── db/                     # Drizzle client and Postgres schema
├── drizzle/                # SQL migrations
├── scripts/                # Migration and integration verification
├── public/                 # Static assets
├── vite.config.ts          # Cloudflare/vinext build configuration
└── wrangler.jsonc          # Cloudflare Workers configuration
```

## Getting Started

### Prerequisites
- Node.js 20.9+
- npm 9+
- A Neon project and Firebase project

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/vello-tech.git
cd vello-tech

# Install the exact dependency lock
npm ci
```

### Environment Variables

Create `.env.local` in the repository root. It is intentionally ignored by Git;
do not commit it. There is no `.env.example` file in this project.

```env
# Neon Postgres
DATABASE_URL=

# Firebase Authentication (browser-safe configuration)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Authentication (server-only service account)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Neon Object Storage
NEON_OBJECT_STORAGE_ENDPOINT=
NEON_OBJECT_STORAGE_BUCKET=
NEON_OBJECT_STORAGE_ACCESS_KEY_ID=
NEON_OBJECT_STORAGE_SECRET_ACCESS_KEY=
NEON_OBJECT_STORAGE_PUBLIC_URL=

# Application and optional integrations
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYSTACK_SECRET_KEY=
LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_DUMMY_VARIANT_ID=
LEMON_SQUEEZY_WEBHOOK_SECRET=
RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

`NEXT_PUBLIC_*` values are embedded in the browser bundle at build time. All
other values above are server-only secrets.

### Service setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Register a Web App, enable **Authentication > Email/Password**, and add the
   Web App configuration plus a service-account credential to `.env.local`.
3. Create a Neon project and put its pooled Postgres connection string in
   `DATABASE_URL`.
4. Configure Neon Object Storage and add its S3-compatible credentials and
   public asset base URL.
5. Apply the database migrations with `npm run db:migrate`.

Firebase is used only for authentication. Application users, products, orders,
carts, wishlists, reviews, settings, and all other persistent application data
live in Neon.

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Verification

```bash
# Verify there are no remaining Firestore application references
npm run migration:code-audit

# Compare the migrated Neon data and object layout with the source export
npm run migration:audit

# Create a disposable Firebase user and test auth + Neon CRUD; cleanup is automatic
npm run test:auth-integration

# Type, lint, and production-build checks
npm run typecheck
npm run lint
npm run build
```

### Deploy to Vercel

Import the repository into Vercel, configure the `.env.local` variables in the
project's Production and Preview environments, and deploy normally. Vercel uses
the unchanged native scripts: `npm run build` and `npm run start`.

### Deploy to Cloudflare Workers

Cloudflare uses the separate vinext/Vite adapter path and does not replace the
native Next.js/Vercel build.

For a Git-integrated **Cloudflare Workers** deployment, configure the build
command as `npm run build:cloudflare` and the deploy command as
`npm run deploy:cloudflare`. Do not use `npm run build` there: that is the
native Next.js build retained for Vercel and expects the Node/Vercel runtime.

```bash
npx wrangler login
npm run cloudflare:check
npm run build:cloudflare
npm run preview:cloudflare
npm run deploy:cloudflare
```

Before deployment, add every variable listed in `wrangler.jsonc` under
`secrets.required` to the Cloudflare Workers project as encrypted secrets. In
Cloudflare Workers Builds, set `NEXT_PUBLIC_SITE_URL` and every
`NEXT_PUBLIC_FIREBASE_*` value as plaintext **build variables** for Production
and Preview. They are browser configuration, not private credentials, and are
embedded into the client bundle at build time.

Payment-provider keys, `RESEND_API_KEY`, and the Upstash Redis variables are
optional at deployment time. Add the keys for each payment provider you enable.
Checkout deliberately remains unavailable until both Upstash Redis rate-limit
variables are set, so a missing optional integration cannot leave payment
endpoints without abuse protection. Keep secret values out of `wrangler.jsonc`;
local preview reads them from the generated, ignored `dist/server/.dev.vars`
file.

At minimum, Firebase session authentication requires `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` as Workers secrets. The
build deliberately does not read these values; they are required when an auth
request reaches the deployed Worker.

## License

MIT - Vello Tech

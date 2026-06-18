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
| **Database** | [Firebase Firestore](https://firebase.google.com/products/firestore) (NoSQL) |
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
│   ├── admin/              # Admin dashboard routes
│   ├── auth/               # Authentication pages
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── admin/              # Admin-specific components
│   └── ...                 # Storefront components
├── lib/
│   ├── contexts/           # React contexts (e.g., AuthContext)
│   ├── store/              # Zustand state stores
│   ├── firebase.ts         # Firebase initialization
│   └── utils.ts            # Utility functions
├── public/                 # Static assets
└── firestore.rules         # Firebase security rules
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

Create a `.env.local` file with the following Firebase configuration details:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Register a Web App and copy the configuration keys into your `.env.local` file.
3. Go to **Authentication** and enable **Email/Password** sign-in.
4. Go to **Firestore Database** and create a database.
5. Deploy the provided Firestore security rules or update them via the Firebase console using the `firestore.rules` file in the repository.

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

## License

MIT - Vello Tech
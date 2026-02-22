# @equitrack/web

Next.js 14 web application for EquiTrack Pro with Tailwind CSS and shadcn/ui.

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ and Redis 7+ (for API integration)

### Installation

```bash
pnpm install
```

### Environment Setup

Create `.env.local`:

```bash
cp .env.example .env.local
```

### Local Development

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Landing page
├── globals.css             # Global styles with Tailwind
└── (dashboard)/            # Dashboard layout group
    ├── layout.tsx          # Dashboard layout
    └── page.tsx            # Dashboard home

components/
├── ui/                     # shadcn/ui components
│   └── button.tsx          # Button component
└── ...                     # Other components

lib/
└── utils.ts               # Utility functions (cn helper)

public/                    # Static assets
```

## Features

### ✓ Next.js 14 App Router

- File-based routing
- Server and client components
- Automatic code splitting
- Built-in optimization

### ✓ Tailwind CSS

- Utility-first CSS framework
- Dark mode support with CSS variables
- Responsive design out of the box
- Performance optimized

### ✓ shadcn/ui

- Copy-paste component library
- Built on Radix UI primitives
- Fully customizable
- TypeScript support

### ✓ Landing Page

- Hero section with CTAs
- Features showcase
- Professional design
- Responsive layout

### ✓ Dashboard Layout

- Sidebar navigation
- Top navigation bar
- Responsive design
- Quick actions

## Styling

### Using Tailwind Classes

```tsx
<div className="bg-white rounded-lg p-6 shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">Hello</h1>
</div>
```

### Using the `cn` Helper

```tsx
import { cn } from "@/lib/utils";

export function Component({ className }) {
  return <div className={cn("px-4 py-2", className)} />;
}
```

## Adding UI Components

To add shadcn/ui components, use the CLI:

```bash
# Example: Add a card component
# npx shadcn-ui@latest add card
```

Or copy components manually from [shadcn/ui](https://ui.shadcn.com).

## Scripts

| Command      | Description              |
| ------------ | ------------------------ |
| `pnpm dev`   | Start development server |
| `pnpm build` | Build for production     |
| `pnpm start` | Start production server  |
| `pnpm lint`  | Run ESLint               |

## Building for Production

```bash
pnpm build
pnpm start
```

The application will be optimized and ready for deployment.

## Environment Variables

| Variable              | Description  | Default                 |
| --------------------- | ------------ | ----------------------- |
| `NEXT_PUBLIC_API_URL` | API endpoint | `http://localhost:3001` |
| `NEXT_PUBLIC_ENV`     | Environment  | `development`           |

## API Integration

The app is configured to work with the `@equitrack/api` service. Set the API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Troubleshooting

### Port 3000 Already in Use

Start on a different port:

```bash
pnpm dev -- -p 3001
```

### Styles Not Loading

Ensure Tailwind CSS is configured properly:

```bash
rm -rf .next node_modules/.cache
pnpm dev
```

### Build Failures

Clear Next.js cache:

```bash
rm -rf .next
pnpm build
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)
- [Lucide Icons](https://lucide.dev)

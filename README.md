# Clinify Dashboard

A modern, sleek healthcare dashboard built with Next.js 15, TypeScript, and Tailwind CSS. Features a beautiful black-themed UI inspired by clinify.so with shadcn/ui components.

## Features

- ✨ Modern black-themed UI design
- 📊 Dashboard with stat cards and metrics
- 🎨 Built with shadcn/ui components
- 🚀 Next.js 15 with App Router
- 💪 TypeScript for type safety
- 🎯 Tailwind CSS for styling
- 📱 Fully responsive design

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
clinify-dashboard/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main dashboard page
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # UI components (Button, Card, etc.)
│   ├── sidebar.tsx      # Dashboard sidebar
│   └── stat-card.tsx    # Metric stat cards
└── lib/
    └── utils.ts         # Utility functions
```

## Customization

### Adding Jotform API Integration

To integrate with Jotform API:

1. Create a `.env.local` file:
```
NEXT_PUBLIC_JOTFORM_API_KEY=your_api_key_here
```

2. Add API calls in your components to fetch form data
3. Update the dashboard with real data from Jotform

### Styling

- Colors and themes are defined in `app/globals.css`
- Modify CSS variables to customize the color scheme
- Component styles use Tailwind CSS classes

## Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui + custom components
- **Icons:** Lucide React

## License

MIT

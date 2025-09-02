# Medisync Inventory System - GEMINI.md

This file provides an overview of the project structure, technologies used, and common commands for the Medisync Inventory System.

## Project Overview

This is a web-based inventory management system built with Next.js and TypeScript. It appears to have features for a dashboard, inventory management, forecasting, reporting, and role management.

## Tech Stack

- **Framework:** Next.js 15.4.1 (with Turbopack)
- **Language:** TypeScript
- **UI:** React 19.1.0
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI (Dialog, Dropdown, Label, Popover, Select, Tabs)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Linting:** ESLint

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev`: Starts the development server with Turbopack.
- `npm run build`: Creates a production build of the application.
- `npm run start`: Starts the production server.
- `npm run lint`: Lints the codebase using ESLint.

## Directory Structure

- `app/`: Contains the application's pages and layouts. Each subdirectory in `app/` corresponds to a route.
- `components/`: Contains reusable React components.
  - `ui/`: Contains UI components built with Radix UI.
- `lib/`: Contains utility functions.
- `public/`: Contains static assets like images and icons.

## Testing

There is no explicit testing framework configured in `package.json`. To add testing, you would typically install a framework like Jest or Vitest and configure it.

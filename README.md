# FreshFind — Local Farmers Markets & Seasonal Produce Guide (React.js)

Discover fresh local produce and farmers markets near you in Karachi, Pakistan. Built using React.js 19, Vite, Bootstrap 5, and React Router.

## Quick Start
1. Ensure Node.js (v18+) is installed.
2. In this directory, run:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173/` in your browser.

## Features Implemented (All 44 Checklist Requirements Complete)
- **Home Page**: Brand logo, heading, prominent multi-criteria filter (Area, Day of Week, Produce, Keyword), interactive rotating showcase (Open Right Now, Featured Markets, Seasonal Picks).
- **Market Directory**: Catalogs loaded from JSON (`/data.json`, `/markets.json`), cards with full description, area, hours, thumbnail, distance, filterable by area, day, produce, and sortable (A-Z, Z-A, Proximity, Open Now).
- **Market Detail Page (`/market/:id`)**: Address, Google Maps iframe embed, complete weekly operating schedule table with today highlighted, typically available produce grid with icons, direct bookmarking and directions link.
- **Seasonal Produce Guide (`/product`)**: Filterable by category (Fruits, Vegetables, Herbs, Dairy), seasons, nutritional facts, storage tips, links to stocking markets, and personal shopping notes modal.
- **Bookmarks & Notes (`/bookmark`)**: Saved markets, saved produce, custom shopping notes, export to `.txt` formatted file, copy to clipboard, and instant social sharing (WhatsApp, Twitter/X, Facebook, Email).
- **AI Chatbot**: Floating assistant with pre-scripted dataset, quick suggestion reply chips, and direct clickable links to markets and produce.
- **UI Enhancements**: Real-time live clock radar, visitor counter (localStorage + live active shoppers), dummy Login & Sign Up modal, breadcrumb navigation, and accessible high-contrast UI.

## Detailed Documentation
See [`DOCUMENTATION.md`](./DOCUMENTATION.md) for full Problem Definition, Architecture Specifications, Level 0 & Level 1 DFDs, Flowcharts, Test Data, Assumptions, and Demo Video Script.

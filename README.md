# Expiry Tracker

A web application for tracking product expiry dates across multiple shop locations.

## Features

### Admin Dashboard

- Manage product categories
- Manage products with images
- Create and manage shop users
- Auto-ordered categories by product count

### User Dashboard

- Track inventory items by expiry date
- Auto-ordered categories (expired/critical first)
- Color-coded warnings (red/yellow)
- Search products with highlighting
- Tablet-optimized interface

## Tech Stack

- **Frontend**: React
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Netlify
- **Deployment**: GitHub auto-deploy

## Local Development

```bash
# Install dependencies
npm install

# Create .env file with:
REACT_APP_SUPABASE_URL=your_url
REACT_APP_SUPABASE_ANON_KEY=your_key

# Run locally
npm start

# Build for production
npm run build
```

## Deployment

Pushes to `main` branch auto-deploy to Netlify.

## Database Setup

See Supabase SQL files in project documentation.

## Support

Contact: your-email@example.com

# Trial Finder

A clean, Apple-inspired clinical trial finder that connects to ClinicalTrials.gov's live API.

![Trial Finder](https://clinicaltrials.gov/img/ctgov-logo.svg)

## Features

- **Live API Connection** - Searches 400,000+ recruiting trials from ClinicalTrials.gov
- **Multiple Browse Modes** - Search directly, browse by category, or use the guided questionnaire
- **Educational Content** - Built-in walkthrough for users new to clinical trials
- **Apple-Inspired Design** - Clean, minimal UI with excellent accessibility
- **Smart Fallbacks** - Works offline with sample data when API is unavailable

## Quick Deploy

### Option 1: Vercel (Recommended - 2 clicks)

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and click "Import Project"
3. Select your GitHub repo
4. Click "Deploy" - that's it!

Or use the Vercel CLI:
```bash
npm i -g vercel
cd trial-finder
vercel
```

### Option 2: Netlify

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `dist` folder (after running `npm run build`)
3. Your site is live!

Or connect your GitHub repo for automatic deploys.

### Option 3: Any Static Host

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The 'dist' folder can be uploaded to any static host:
# - GitHub Pages
# - AWS S3 + CloudFront
# - Google Cloud Storage
# - Firebase Hosting
# - Cloudflare Pages
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
trial-finder/
├── index.html          # Entry HTML file
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── postcss.config.js   # PostCSS configuration
└── src/
    ├── main.jsx        # React entry point
    ├── App.jsx         # App wrapper
    ├── TrialFinder.jsx # Main component (all UI logic)
    └── index.css       # Global styles + Tailwind
```

## Customization

### Change Branding

Edit the `Header` component in `src/TrialFinder.jsx`:
- Update the logo SVG
- Change "Trial Finder" text
- Modify colors (default is black/white)

### Add Categories

Find the `categories` array in `src/TrialFinder.jsx`:
```javascript
const categories = [
  { id: 'cancer', name: 'Cancer', query: 'cancer', icon: '🎗️', count: 18794 },
  // Add more categories here
];
```

### Modify Questionnaire

Edit the `steps` array inside `QuestionnaireModal`:
```javascript
const steps = [
  {
    id: 'condition',
    title: "What condition are you exploring?",
    type: 'input',
    placeholder: "e.g., breast cancer..."
  },
  // Add or modify steps
];
```

## API Notes

This app uses the ClinicalTrials.gov API v2:
- **Base URL**: `https://clinicaltrials.gov/api/v2/studies`
- **No API key required**
- **Rate limits**: Be respectful, ~3 requests/second max
- **Documentation**: [ClinicalTrials.gov API](https://clinicaltrials.gov/data-api/api)

The app includes fallback sample data when:
- User is offline
- API is temporarily unavailable
- CORS issues occur (rare in production)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT - Feel free to use for any purpose.

## Contributing

Contributions welcome! Please feel free to submit a PR.

---

Built with React, Vite, and Tailwind CSS. Data from [ClinicalTrials.gov](https://clinicaltrials.gov).

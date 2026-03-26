# 🎬 Ignes

**Your Personal Movie Logging & AI Discovery Platform**

Ignes is a React-based web application that lets you log, track, and visualize your movie-watching journey. Unlike traditional platforms like Letterboxd, Ignes focuses on emotional tracking, AI-powered discovery, and deep cinematic insights with the **Ember Oracle** — your personal film curator.

---

## ✨ Features

### Core Functionality
- **Trending Movies**: Browse trending movies from TMDB with beautiful backdrop images
- **Movie Search**: Search for any movie using TMDB API with global header search bar
- **Movie Details**: View detailed information with high-res backdrops, cast, and recommendations
- **Rotten Tomatoes Scores**: See critic scores fetched from OMDb API
- **Personal Reviews**: Log movies with ratings, moods, reviews, and watch status
- **My Library**: StoryGraph-style library with Watched/Want to Watch tabs and rich movie cards
- **Custom Lists**: Create and manage personalized movie collections
- **Edit Reviews**: Click "Edit Log" to update your existing movie reviews
- **Mood Palette**: Tag movies with 22 moods across 3 categories (Emotional, Vibe, Intellectual)
- **Precision Rating Slider**: StoryGraph-style 0.0-5.0 rating with 0.1 increments
- **Clickable Movie Cards**: Click any movie card to view full details
- **Clickable Cast Members**: Click any actor to see their profile and filmography
- **Actor Pages**: Actor bios, photos, and top movies sorted by popularity
- **Stats Dashboard**: Visualize your watching habits with Top Genres, Mood Breakdown, and Ratings Distribution charts

### 🤖 AI Features (Ember Oracle)
- **Ember Oracle v2.1**: Multi-movie AI discovery with natural language vibe search
- **Multi-Movie Recommendations**: Returns 3-5 curated films per query (cult classics + deep cuts)
- **Hybrid AI Orchestration**: Groq LPU for fast genre extraction + Gemini for deep reasoning
- **Sub-500ms Genre Parsing**: Ultra-fast vibe-to-genre translation via Groq's LPU hardware
- **Personalized Oracle**: AI knows your entire library (watched + watchlist + custom lists)
- **Zero-Duplicate Guarantee**: All known movies banned from recommendations automatically
- **Taste Triangulation**: AI analyzes your high-rated films before suggesting new discoveries
- **Mood Bubbles**: 6 quick-select presets (Cozy, Adrenaline, Mind-Bending, Deep Cuts, Noir, Euphoric)
- **Reject & Reroll**: Reject entire batch and get instant alternative recommendations
- **Deep Cut Recommendations**: AI prioritizes obscure gems over mainstream blockbusters
- **Rationale Display**: "Why Ignes Picked This" with specific cinematic analysis for each film
- **Vibe Check Tagline**: 5-7 word punchy essence descriptions per movie
- **Session Tracking**: Tracks rejected movies to avoid repeat suggestions
- **Concurrent Data Fetching**: All movie posters/data load in parallel for faster UX

### Advanced Features
- **Mobile-First Responsive Navbar**: Hamburger menu (mobile) / Inline nav links (desktop 768px+)
  - **Desktop View**: Logo | Discover, Trending, Library, History | Search + Profile
  - **Mobile View**: Logo + Hamburger → Full-width dropdown with search + nav
- **Watch History Timeline**: Vertical timeline of watched movies grouped by month
- **Up Next Queue**: Maintain a curated shelf of your next 5 movies to watch
- **User Authentication**: Secure login/signup with Supabase Auth
- **Remember Me**: Toggle between persistent (localStorage) and session-only (sessionStorage) login
- **Forgot Password Flow**: Email-based password reset with Supabase Auth
- **Editable Profiles**: Customizable display names and bios with avatar upload
- **Row Level Security**: Secure data policies protecting user movie logs

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18+, React Router, Vite |
| **Styling** | CSS Grid, Flexbox, Custom Components |
| **External APIs** | TMDB (movie data, recommendations), OMDb (Rotten Tomatoes scores) |
| **Backend/Database** | Supabase (Auth, PostgreSQL, RLS) |
| **AI Integration** | Google Gemini API + Groq LPU (hybrid orchestration for multi-movie recommendations) |
| **Visualization** | Recharts (charts and graphs) |

---

## 📁 Project Structure

```
Ignes/
├── src/
│   ├── components/
│   │   ├── GlobalSearch.jsx     # Global search bar in header
│   │   ├── IgnesLogo.jsx        # Ignes flame logo component
│   │   ├── Logo.jsx             # Legacy logo component
│   │   ├── Footer.jsx           # App footer with TMDB/OMDb attributions
│   │   ├── MovieCard.jsx        # Movie card with poster, title, RT score
│   │   ├── RatingSlider.jsx     # StoryGraph-style precision rating slider (0.0-5.0)
│   │   ├── MoodChip.jsx         # Categorized mood selector (Emotional/Vibe/Intellectual)
│   │   ├── LogMovieModal.jsx    # Modal for logging movies with full form
│   │   ├── ProtectedRoute.jsx   # Auth guard for protected pages
│   │   ├── SearchBar.jsx        # Movie search input with loading state
│   │   ├── SearchResults.jsx    # Grid of movie search results
│   │   ├── StarRating.jsx       # Clickable star rating component
│   │   ├── QuickLaunchButton.jsx # Windows quick launch button
│   │   └── *.css                # Component styles
│   ├── pages/
│   │   ├── TrendingMovies.jsx   # Trending movies backdrop grid (Home)
│   │   ├── SearchPage.jsx       # TMDB search functionality with Power Filter
│   │   ├── MovieDetail.jsx      # Movie details with backdrop & recommendations
│   │   ├── ActorPage.jsx        # Actor bio and filmography page
│   │   ├── LoginPage.jsx        # User login form
│   │   ├── RegisterPage.jsx     # User signup form
│   │   ├── LibraryPage.jsx      # User library with tabs (Watched/Want to Watch)
│   │   ├── ProfilePage.jsx      # Editable user profile with AI Discovery
│   │   ├── WatchHistory.jsx     # Timeline of watched movies grouped by month
│   │   ├── StatsDashboard.jsx   # Analytics dashboard with charts
│   │   ├── ComponentsDemo.jsx   # Component showcase page
│   │   ├── SupabaseDemo.jsx     # Supabase connection demo
│   │   └── *.css                # Page styles
│   ├── context/
│   │   └── UserContext.jsx      # User authentication state (Supabase Auth)
│   ├── api/
│   │   ├── tmdb.js              # TMDB API (trending, details, recommendations, discover)
│   │   └── omdb.js              # OMDb API (Rotten Tomatoes scores)
│   ├── utils/
│   │   └── gemini.js            # Gemini AI integration for recommendations
│   ├── assets/                  # Static assets and images
│   ├── supabaseClient.js        # Supabase client initialization
│   ├── App.jsx                  # Main app with routing
│   ├── App.css                  # Global styles
│   └── index.jsx                # Entry point
├── resources/                   # TMDB attribution logos
├── public/
├── index.html
├── package.json
├── vite.config.js
├── .env                         # Environment variables (TMDB, Supabase, Gemini keys)
├── .env.example                 # Environment variables template
├── launch.bat                   # Quick launch script for Windows
├── ROADMAP.md                   # Development roadmap
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- TMDB API Key ([Get it free](https://www.themoviedb.org/settings/api))
- OMDb API Key ([Get it free](http://www.omdbapi.com/apikey.aspx)) - Already configured
- Gemini API Key ([Get it free](https://aistudio.google.com/app/apikey)) - For AI features

### Installation

```bash
# Clone the repository
cd Ignes

# Install dependencies
npm install

# Create .env file with your API keys
cp .env.example .env

# Edit .env and add your API keys:
# VITE_TMDB_API_KEY=your_actual_tmdb_api_key
# VITE_SUPABASE_URL=your_supabase_project_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_GEMINI_API_KEY=your_gemini_api_key

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quick Launch (Windows)
Double-click `launch.bat` to start the dev server and open the app automatically.

---

## 📋 Development Roadmap

See [ROADMAP.md](./ROADMAP.md) for the detailed development plan.

### Current Status: Phase 6 In Progress 🚀

**Phase 5: AI Integration** is complete with:
- ✅ Gemini AI-powered recommendations
- ✅ Privacy-first opt-in toggle
- ✅ Banished list (never suggest rejected movies again)
- ✅ Library integration (Add to Watchlist / Mark as Watched)
- ✅ TMDB verification for all AI suggestions

**Phase 6: Ember Oracle & Social** is underway:
- ✅ **Ember Oracle** (v1.3.2) - Conversational AI with natural language vibe search
- ✅ **Mood Bubbles** - 6 quick-select presets for instant discovery
- ✅ **Reject & Reroll** (v1.3.5) - Reject suggestions and get alternatives
- ✅ **Custom Lists** (v1.3.1) - User-created movie collections
- ✅ **Remember Me** (v1.3.3) - Dynamic storage persistence toggle
- ⬜ **The Matchmaker** - Social compatibility with mood overlaps
- ⬜ **Social Sharing** - Share movie logs to social media

---

## 📄 License

**All Rights Reserved.**

This project is proprietary software. You may not use, copy, modify, distribute, or create derivative works from this software without explicit permission from the author.

For licensing inquiries or permission requests, please contact the project author.

---

## 🙏 Acknowledgments

- Movie data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Rotten Tomatoes scores via [OMDb API](http://www.omdbapi.com/)
- AI recommendations powered by [Google Gemini API](https://aistudio.google.com/)
- Inspired by Letterboxd and StoryGraph

---

## 🔥 Brand Assets

### Ignes Logo
The Ignes logo features a flame symbol with a geometric 'I' cutout, representing the spark of discovery in your film journey.

**Colors:**
- Deep Ember Burgundy: `#991b1b` (primary)
- Amethyst: `#7e22ce` (accent)
- Dark Background: `#0a0a0a`

**Usage:**
```jsx
import IgnesLogo from './components/IgnesLogo';

// Header logo (with text)
<IgnesLogo size={40} showText={true} />

// Just the flame symbol
<IgnesLogo size={40} showText={false} />
```

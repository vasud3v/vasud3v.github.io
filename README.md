# Clove Forum

A modern, feature-rich forum application built with React, TypeScript, and Supabase. Clove provides a vibrant community platform with real-time updates, rich text editing, and comprehensive moderation tools.

## What is Clove Forum?

Clove Forum is a full-featured community discussion platform designed for building engaged online communities. Whether you're creating a support forum, a hobbyist community, a developer discussion board, or any other type of online gathering space, Clove provides all the tools you need to foster meaningful conversations and connections.

The platform enables users to:
- Start and participate in threaded discussions organized by categories and topics
- Connect with other members through following, messaging, and reactions
- Build reputation through quality contributions and community engagement
- Discover trending content and active discussions
- Customize their profiles and express their identity

For administrators and moderators, Clove offers:
- Powerful moderation tools to maintain community standards
- Analytics dashboard to track community growth and engagement
- Flexible permission system with roles and access control
- Content reporting and review workflows
- Customizable announcements and community rules

Built with modern web technologies, Clove delivers a fast, responsive experience with real-time updates that keep conversations flowing naturally.

## Features

### Core Functionality
- **Thread Management**: Create, edit, and organize discussion threads with categories and topics
- **Rich Text Editor**: Advanced TipTap-based editor with formatting, images, tables, and code highlighting
- **Real-time Updates**: Live synchronization of posts, reactions, and user activity via Supabase Realtime
- **User Profiles**: Customizable profiles with avatars, banners, and reputation tracking
- **Voting System**: Upvote/downvote threads and posts with reputation rewards
- **Reactions**: Express yourself with emoji reactions on posts
- **Polls**: Create and vote on polls within threads

### Social Features
- **User Following**: Follow other users and see their activity in a personalized feed
- **Notifications**: Real-time notifications for mentions, replies, and interactions
- **Private Messaging**: Direct messaging between users
- **Bookmarks**: Save posts for later reference
- **Thread Watching**: Subscribe to threads and get notified of new replies

### Moderation & Administration
- **Admin Dashboard**: Comprehensive admin panel with analytics and management tools
- **User Roles**: Support for admin, moderator, and member roles
- **Moderation Logs**: Track all moderation actions
- **Content Reports**: User reporting system with admin review
- **Announcement Banners**: Site-wide announcements
- **Forum Rules**: Customizable community guidelines

### Additional Features
- **Search**: Full-text search across threads and posts
- **Trending Content**: Discover popular threads and active discussions
- **Leaderboards**: Track top contributors by reputation
- **Member Directory**: Browse and filter community members
- **Mobile Responsive**: Fully responsive design with mobile-optimized navigation
- **Dark Theme**: Modern dark theme with pink accent colors

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **TipTap** - Rich text editor
- **Framer Motion** - Animations
- **Recharts** - Analytics charts

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Row Level Security (RLS)
  - Storage for images
- **Express** - File upload server for topic icons

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Concurrently** - Run multiple dev servers

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- ImgBB API key (optional, for image hosting)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd clove-forum
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ImgBB Image Hosting (Optional)
VITE_IMGBB_API_KEY=your-imgbb-api-key
```

Get your Supabase credentials from:
- Go to https://app.supabase.com
- Select your project
- Navigate to Settings > API
- Copy the Project URL and anon public key

4. Set up the database:

Run the database migration scripts in the `scripts/` directory to create the necessary tables and policies. Key scripts include:
- Database schema setup
- Row Level Security policies
- Storage bucket configuration
- Realtime triggers

5. Start the development servers:
```bash
npm run dev
```

This will start:
- Vite dev server (frontend) on http://localhost:5173
- Express upload server on http://localhost:3000
- Express media server on http://localhost:3001

## Available Scripts

### Development
- `npm run dev` - Start all development servers concurrently
- `npm run dev:vite` - Start only the Vite dev server
- `npm run server` - Start only the upload server
- `npm run upload-server` - Start only the media upload server

### Build
- `npm run build` - Build for production
- `npm run build:check` - Build with TypeScript type checking
- `npm run preview` - Preview production build locally

### Database Management
- `npm run clear-seed` - Clear seed data
- `npm run clear-all` - Clear all forum data
- `npm run sync-users` - Sync authentication users with forum users
- `npm run check-categories` - Check and fix category issues
- `npm run force-categories` - Force create default categories

### Utilities
- `npm run lint` - Run ESLint
- `npm run types:supabase` - Generate TypeScript types from Supabase schema

## Project Structure

```
clove-forum/
├── public/              # Static assets
│   ├── topic-icons/     # Uploaded topic icons
│   └── 404.html         # GitHub Pages SPA fallback
├── scripts/             # Database migration and utility scripts
├── src/
│   ├── components/      # React components
│   │   ├── auth/        # Authentication components
│   │   ├── forum/       # Forum-specific components
│   │   │   ├── admin/   # Admin dashboard tabs
│   │   │   └── editor/  # Rich text editor components
│   │   └── ui/          # Reusable UI components (Radix-based)
│   ├── context/         # React context providers
│   │   ├── AuthContext.tsx
│   │   ├── ForumContext.tsx
│   │   └── NotificationContext.tsx
│   ├── hooks/           # Custom React hooks
│   │   └── forum/       # Forum-specific hooks
│   ├── lib/             # Utility libraries
│   │   ├── supabase.ts  # Supabase client configuration
│   │   ├── forumUtils.ts
│   │   └── queries.ts
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component with routing
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── server.js            # Express server for file uploads
├── server-upload.js     # Express server for media uploads
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # TailwindCSS configuration
└── package.json         # Dependencies and scripts
```

## Database Schema

The application uses Supabase PostgreSQL with the following main tables:

- `forum_users` - User profiles and metadata
- `forum_categories` - Top-level forum categories
- `forum_topics` - Topics within categories
- `forum_threads` - Discussion threads
- `forum_posts` - Individual posts/replies
- `forum_polls` - Poll data
- `forum_poll_options` - Poll voting options
- `forum_poll_votes` - User poll votes
- `thread_votes` - Thread upvotes/downvotes
- `post_votes` - Post upvotes/downvotes
- `post_reactions` - Emoji reactions on posts
- `thread_watches` - Thread subscriptions
- `post_bookmarks` - Saved posts
- `user_follows` - User following relationships
- `notifications` - User notifications
- `messages` - Private messages
- `reputation_events` - Reputation history
- `moderation_logs` - Moderation actions
- `content_reports` - User reports
- `announcement_banners` - Site announcements

## Configuration

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL migration scripts from the `scripts/` directory
3. Configure storage buckets for avatars and banners
4. Enable Realtime for relevant tables
5. Set up Row Level Security policies

### Image Hosting

The application supports two image hosting options:

1. **ImgBB** (default): Free image hosting service
   - Get an API key from https://api.imgbb.com/
   - Add to `.env.local` as `VITE_IMGBB_API_KEY`

2. **Supabase Storage**: Store images in your Supabase project
   - Configure storage buckets via scripts
   - More control but counts toward storage limits

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Deploy to Vercel/Netlify

1. Connect your repository
2. Set environment variables
3. Build command: `npm run build`
4. Output directory: `dist`

### Deploy to GitHub Pages

The project includes a 404.html redirect handler for SPA routing on GitHub Pages.

1. Build the project
2. Deploy the `dist/` directory to GitHub Pages
3. Ensure the CNAME file is in the `public/` directory if using a custom domain

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.

## Support

For issues and questions:
- Check the `/support` page in the application
- Review the forum rules at `/rules`
- Contact the administrators through the admin dashboard

## Acknowledgments

- Built with [Supabase](https://supabase.com)
- UI components from [Radix UI](https://www.radix-ui.com)
- Icons from [Lucide](https://lucide.dev)
- Rich text editing powered by [TipTap](https://tiptap.dev)

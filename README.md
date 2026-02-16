# Git PR Documentation Generator

A Next.js application that automatically generates technical documentation for GitHub Pull Requests using AI.

## Features

- 🔐 GitHub OAuth authentication
- 📄 Fetch and analyze GitHub PRs
- 🤖 AI-powered documentation generation using Groq (with NVIDIA Kimi K2.5 fallback)
- 📊 Export documentation to Google Docs
- 🎨 Modern, responsive UI

## Getting Started

### Prerequisites

- Node.js 18+ installed
- GitHub account
- Groq API key (primary)
- NVIDIA API key (optional, for fallback - Kimi K2.5 model)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd git-pr
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required values:

```bash
# GitHub OAuth (create at https://github.com/settings/developers)
GITHUB_ID=your_github_oauth_app_client_id
GITHUB_SECRET=your_github_oauth_app_client_secret

# Google OAuth (create at https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Groq API (get from https://console.groq.com)
GROQ_API=your_groq_api_key

# NVIDIA API (optional fallback, get from https://build.nvidia.com/)
NVIDIA_API_KEY=your_nvidia_api_key_here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### AI Generation with Fallback

The app uses a smart fallback mechanism for AI generation:

1. **Primary**: Groq API (`openai/gpt-oss-120b` model)
   - Fast and efficient for most PRs
   - 8,000 token limit per minute

2. **Fallback**: NVIDIA Kimi K2.5 API (`moonshotai/kimi-k2.5` model)
   - Automatically used when Groq hits rate limits
   - Handles larger PRs with more changes
   - 16,384 max tokens - 2x larger than Groq

3. **Automatic Truncation**: 
   - Diff data is automatically truncated to fit within token limits
   - Limits: 20 files max, 100 lines per file
   - Ensures successful generation even for very large PRs

### Error Handling

The app handles several error scenarios:

- **413 Rate Limit Error**: Automatically falls back to NVIDIA Kimi K2.5
- **Large PRs**: Truncates diff data intelligently
- **API Failures**: Provides clear error messages to users

## Usage

1. Sign in with your GitHub account
2. Enter the repository owner, name, and PR number
3. Click "Fetch PR" to load the pull request
4. Click "Generate Summary" to create AI documentation
5. Optionally export to Google Docs

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Troubleshooting

### "Request too large" Error

If you see a 413 error:
1. The app will automatically try NVIDIA Kimi K2.5 as fallback
2. If both fail, the PR is too large - try a smaller PR
3. Consider adding your NVIDIA API key for better fallback support

### Authentication Issues

- Ensure your OAuth apps are properly configured
- Check that redirect URLs match your deployment URL
- Verify all environment variables are set correctly

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Groq API Documentation](https://console.groq.com/docs)
- [NVIDIA NIM API](https://build.nvidia.com/)


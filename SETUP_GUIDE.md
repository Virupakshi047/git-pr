# Multi-User Authentication Setup Guide

This guide will help you set up the multi-user authentication system for PR Documenter.

## Prerequisites

- Node.js 18+ installed
- A GitHub account
- A Google Cloud account

---

## Step 1: Create GitHub OAuth App

1. Go to **GitHub Settings** → **Developer settings** → **OAuth Apps**
   - Direct link: https://github.com/settings/developers

2. Click **"New OAuth App"**

3. Fill in the details:
   - **Application name**: `PR Documenter` (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

4. Click **"Register application"**

5. Copy the **Client ID** - this is your `GITHUB_ID`

6. Click **"Generate a new client secret"** and copy it - this is your `GITHUB_SECRET`

---

## Step 2: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Create a new project or select an existing one

3. Enable the required APIs:
   - Go to **APIs & Services** → **Library**
   - Search and enable:
     - **Google Drive API**
     - **Google Docs API**

4. Configure OAuth Consent Screen:
   - Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** user type
   - Fill in the required fields:
     - App name: `PR Documenter`
     - User support email: Your email
     - Developer contact email: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/drive.file`
     - `https://www.googleapis.com/auth/documents`
   - Add your email as a test user (for development)

5. Create OAuth Credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - Application type: **Web application**
   - Name: `PR Documenter`
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

6. Copy the **Client ID** - this is your `GOOGLE_CLIENT_ID`

7. Copy the **Client Secret** - this is your `GOOGLE_CLIENT_SECRET`

---

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your values:
   ```env
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=generate_a_random_32_character_string
   
   # GitHub OAuth
   GITHUB_ID=your_github_client_id
   GITHUB_SECRET=your_github_client_secret
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Groq API
   GROQ_API=your_groq_api_key
   ```

3. Generate `NEXTAUTH_SECRET`:
   ```bash
   # On Linux/Mac:
   openssl rand -base64 32
   
   # On Windows (PowerShell):
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -join ''))
   ```

---

## Step 4: Run the Application

```bash
npm install
npm run dev
```

Open http://localhost:3000 and you should see the login page!

---

## Production Deployment

### For Vercel:

1. Add all environment variables in **Project Settings** → **Environment Variables**

2. Update callback URLs in GitHub and Google:
   - GitHub: `https://your-domain.vercel.app/api/auth/callback/github`
   - Google: `https://your-domain.vercel.app/api/auth/callback/google`

3. Update `NEXTAUTH_URL` to your production domain

### Google OAuth Production:

1. Go to **OAuth consent screen** in Google Cloud
2. Click **"Publish App"** to make it available to all users
3. Submit for verification if using sensitive scopes

---

## How It Works

### Authentication Flow:

1. **User clicks "Sign in with GitHub"**
   - Redirected to GitHub OAuth
   - Grants access to repositories
   - Token saved in JWT session

2. **User clicks "Connect Google Drive"**
   - Redirected to Google OAuth
   - Grants access to Drive
   - Token saved in JWT session

3. **User generates documentation**
   - GitHub token used to fetch PR data
   - Google token used to save to Drive
   - Each user's docs go to their own Drive

### Data Storage:

- **JWT Sessions**: Tokens stored in encrypted cookies
- **No Database Required**: Stateless authentication
- **Per-User Isolation**: Each user's tokens are isolated

---

## Troubleshooting

### "Access Denied" Error

- Make sure you've added yourself as a test user in Google Cloud Console
- Check that all OAuth scopes are enabled

### "Invalid Callback URL" Error

- Verify the callback URLs match exactly in GitHub/Google settings
- Include the trailing `/github` or `/google` in the callback URL

### "Token Expired" Error

- Google access tokens expire after 1 hour
- Users need to reconnect in Settings page
- Consider implementing token refresh (advanced)

### "Drive Permission Denied"

- User may not have granted Drive access
- Go to Settings and reconnect Google

---

## Security Notes

- Never commit `.env` files to version control
- Rotate secrets regularly in production
- Use strong `NEXTAUTH_SECRET` (32+ characters)
- Enable HTTPS in production

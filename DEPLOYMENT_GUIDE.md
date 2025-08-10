# Production Deployment Guide

## 🚀 Vercel Deployment (Recommended)

### Prerequisites

*   A Vercel account.
*   The Vercel CLI installed (optional, but recommended for local deployment testing).
    \`\`\`bash
    npm i -g vercel
    \`\`\`
*   Your Google Cloud Project and Google Sheets API setup completed as per `GOOGLE_SHEETS_SETUP.md`.

### Step 1: Prepare Repository
\`\`\`bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/yourusername/judge-dashboard.git
git push -u origin main
\`\`\`

### Step 2: Vercel Setup

#### Option A: Deploy via Vercel Dashboard (Recommended)
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New... > Project**.
3. Select your Git repository (e.g., from GitHub, GitLab, or Bitbucket).
4. **Configure Project**:
   * **Framework Preset**: Next.js
   * **Root Directory**: (Leave blank if your project is at the root of the repo, otherwise specify the path).
   * **Environment Variables**: This is where you add your sensitive keys.
     * Click **Add** for each variable:
       * `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`: Paste your Base64 encoded key here.
       * `CREDENTIALS_SPREADSHEET_ID`: Your credentials sheet ID.
       * `CLASS_4_SPREADSHEET_ID`: Your Class 4 sheet ID.
       * `CLASS_5_SPREADSHEET_ID`: Your Class 5 sheet ID.
       * ... (add all other `CLASS_X_SPREADSHEET_ID` variables)
     * Ensure these variables are set for the "Production", "Preview", and "Development" environments as needed.
5. Click **Deploy**.

Vercel will automatically detect your Next.js project, install dependencies, build the application, and deploy it. You will get a unique URL for your deployment.

#### Option B: Deploy via Vercel CLI
1. **Log in to Vercel CLI:**
   \`\`\`bash
   vercel login
   \`\`\`
2. **Navigate to your project directory:**
   \`\`\`bash
   cd /path/to/your/judge-dashboard-nextjs
   \`\`\`
3. **Add Environment Variables:**
   You can add environment variables directly via the CLI. For sensitive keys, it's best to add them as "secrets".
   \`\`\`bash
   vercel env add GOOGLE_SERVICE_ACCOUNT_KEY_BASE64
   # Paste your Base64 encoded key when prompted
   vercel env add CREDENTIALS_SPREADSHEET_ID
   # Paste your credentials sheet ID when prompted
   # Repeat for all CLASS_X_SPREADSHEET_ID variables
   vercel env add CLASS_4_SPREADSHEET_ID
   # ... and so on
   \`\`\`
   You can verify your environment variables with `vercel env ls`.
4. **Deploy your project:**
   \`\`\`bash
   vercel
   \`\`\`
   Follow the prompts to link your project to a Vercel scope and project. Vercel will then build and deploy your application.

### Step 3: Environment Variables
Add these in Vercel dashboard under "Settings" > "Environment Variables":

\`\`\`env
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=your_base64_encoded_key_here
CREDENTIALS_SPREADSHEET_ID=1snk-FZaxyZbSu_Ww-oPnam8JxZ2RLg3etI5TBkr-T1A
CLASS_4_SPREADSHEET_ID=your_actual_class_4_id
CLASS_5_SPREADSHEET_ID=your_actual_class_5_id
# ... continue for all classes
\`\`\`

### Step 4: Service Account Key
Since Vercel doesn't support file uploads, encode your service account key:

\`\`\`bash
# Encode the JSON file to base64
cat config/service-account-key.json | base64
\`\`\`

Add this as an environment variable:
\`\`\`env
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=your_base64_encoded_key_here
\`\`\`

Update `lib/google-sheets.ts` to handle base64 decoding:
\`\`\`typescript
// Add this to the constructor
if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64) {
  const keyData = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8')
  const keyPath = '/tmp/service-account-key.json'
  require('fs').writeFileSync(keyPath, keyData)
  this.auth = new GoogleAuth({
    keyFile: keyPath,
    scopes: GOOGLE_SHEETS_CONFIG.scopes,
  })
} else {
  this.auth = new GoogleAuth({
    keyFile: GOOGLE_SHEETS_CONFIG.serviceAccountKeyPath,
    scopes: GOOGLE_SHEETS_CONFIG.scopes,
  })
}
\`\`\`

### Step 5: Deploy
1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Test the deployed application

## 🐳 Docker Deployment

### Dockerfile
\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Create config directory
RUN mkdir -p /app/config

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
\`\`\`

### Docker Compose
\`\`\`yaml
version: '3.8'
services:
  judge-dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/app/config/service-account-key.json
      - CREDENTIALS_SPREADSHEET_ID=1snk-FZaxyZbSu_Ww-oPnam8JxZ2RLg3etI5TBkr-T1A
    volumes:
      - ./config/service-account-key.json:/app/config/service-account-key.json:ro
    restart: unless-stopped
\`\`\`

## 🔒 Security Checklist

- [ ] Service account key is not in version control
- [ ] Environment variables are properly configured
- [ ] HTTPS is enabled in production
- [ ] Google Sheets have proper permissions
- [ ] API quotas are monitored
- [ ] Error logging is configured
- [ ] Backup strategy is in place

## 📈 Monitoring Setup

### Health Check Endpoint
Add to `app/api/health/route.ts`:
\`\`\`typescript
import { NextResponse } from "next/server"
import { GoogleSheetsService } from "@/lib/google-sheets"

export async function GET() {
  try {
    const sheetsService = new GoogleSheetsService()
    // Test connection
    await sheetsService.getCredentials()
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        googleSheets: "connected"
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      error: "Google Sheets connection failed"
    }, { status: 500 })
  }
}
\`\`\`

### Uptime Monitoring
- Use services like Uptime Robot or Pingdom
- Monitor `/api/health` endpoint
- Set up alerts for downtime

## 🔄 Backup Strategy

### Automated Backups
\`\`\`typescript
// Add to a scheduled job or cron
export async function backupData() {
  const sheetsService = new GoogleSheetsService()
  
  // Backup credentials
  const credentials = await sheetsService.getCredentials()
  
  // Backup all class data
  const classes = Object.keys(SPREADSHEET_CONFIG.CLASSES)
  const backupData = {
    timestamp: new Date().toISOString(),
    credentials,
    classes: {}
  }
  
  for (const className of classes) {
    backupData.classes[className] = await sheetsService.getProjectIds(className)
  }
  
  // Store backup (implement your storage solution)
  console.log('Backup completed:', backupData)
}
\`\`\`

This completes the comprehensive Judge Dashboard application with full Google Sheets integration, production deployment guides, and security best practices.

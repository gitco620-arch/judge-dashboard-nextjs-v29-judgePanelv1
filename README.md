# Judge Dashboard for School Project Fair

This is a Next.js application designed to serve as a Judge Dashboard for a school project fair, integrating with Google Sheets for data storage and management.

## Features

*   **User Authentication**: Judges and Admins can log in.
*   **Judge Dashboard**:
    *   Select a class to view available projects.
    *   Select a project to start judging.
    *   **Project Locking**: Judges can score a project only once. Once scores are submitted, the project is locked for that judge.
    *   **Append-Only Scoring**: Judges can submit multiple scores for the same project (e.g., if they judge different students within the same project ID at different times), and all scores will be appended to their personal judge sheet without overwriting previous entries.
    *   **Navigation**: "Next Project" and "Previous Project" buttons for sequential judging.
    *   **Unsaved Changes Warning**: Prompts the judge if they try to navigate away with unsaved scores.
    *   **View My Scores**: Judges can view all their submitted scores.
    *   **CSV Export**: Export personal scores to CSV.
*   **Admin Dashboard**: (Placeholder for future features like user management, overall score viewing, etc.)
*   **Google Sheets Integration**:
    *   Reads judge credentials from a dedicated Google Sheet.
    *   Reads student project data from class-specific "BaseSheet" tabs.
    *   Creates and writes judge-specific scores to "Judge\_<JudgeName>" sheets within the class spreadsheets.
    *   Automatically creates judge sheets if they don't exist.

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   A Google Cloud Project with Google Sheets API enabled.
*   A Google Service Account with access to your Google Sheets.

### Installation

1.  **Clone the repository:**

    \`\`\`bash
    git clone <repository-url>
    cd judge-dashboard-nextjs
    \`\`\`

2.  **Install dependencies:**

    \`\`\`bash
    npm install
    # or
    yarn install
    \`\`\`

3.  **Configure Google Sheets API:**
    Follow the detailed instructions in `GOOGLE_SHEETS_SETUP.md` to:
    *   Enable Google Sheets API in your Google Cloud Project.
    *   Create a Service Account and generate a JSON key file.
    *   Share your Google Sheets (Credentials Sheet, Class Base Sheets) with the Service Account's email address.
    *   Set up environment variables (`.env.local` for local development, or Vercel Project Settings for deployment).

    **Crucially, ensure you have:**
    *   `CREDENTIALS_SPREADSHEET_ID` set to your credentials sheet ID.
    *   `CLASS_X_SPREADSHEET_ID` for each class you want to manage.
    *   Either `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` (for local) or `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` (for deployment) configured correctly.

### Running the Application

1.  **Start the development server:**

    \`\`\`bash
    npm run dev
    # or
    yarn dev
    \`\`\`

2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

*   `app/`: Next.js App Router pages and API routes.
    *   `page.tsx`: Login page.
    *   `judge-dashboard/page.tsx`: Judge's main dashboard for selecting classes and projects.
    *   `judge-panel/page.tsx`: Interface for judges to score projects.
    *   `judge-scores/page.tsx`: Page for judges to view their submitted scores.
    *   `admin-dashboard/page.tsx`: Admin dashboard (placeholder).
    *   `api/auth/route.ts`: API route for user authentication.
    *   `api/projects/route.ts`: API route to fetch project IDs for a class.
    *   `api/students/route.ts`: API route to fetch student details for a project.
    *   `api/judge-scores/route.ts`: API route to fetch and save judge scores.
*   `components/ui/`: Shadcn UI components.
*   `lib/google-sheets.ts`: Service class for interacting with Google Sheets API.
*   `config/service-account-key-example.json`: Example structure for your service account key. **Do NOT use directly in production.**
*   `.env.example`: Example environment variables.

## Deployment

This application is designed to be easily deployable to Vercel. Refer to `DEPLOYMENT_GUIDE.md` for detailed instructions.

## Important Notes

*   **Security**: Always keep your service account key secure. Use environment variables for production deployments.
*   **Google Sheets Permissions**: Ensure your service account has "Editor" access to all relevant Google Sheets.
*   **Error Handling**: The application includes basic error handling for API calls and sheet operations.
*   **Scalability**: For very large numbers of projects or judges, consider optimizing Google Sheets interactions or exploring database alternatives.

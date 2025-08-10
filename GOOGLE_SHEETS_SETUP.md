# Google Sheets API Setup Guide

This guide will walk you through the steps to set up a Google Cloud Service Account and configure your Google Sheets for use with this application.

## 1. Enable Google Sheets API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a new project.
3. In the navigation menu, go to **APIs & Services > Library**.
4. Search for "Google Sheets API" and enable it.

## 2. Create a Service Account

1. In the Google Cloud Console, go to **APIs & Services > Credentials**.
2. Click **+ CREATE CREDENTIALS** and select **Service account**.
3. Enter a **Service account name** (e.g., `sheets-api-service`) and click **CREATE AND CONTINUE**.
4. For **Grant this service account access to project**, select the role `Project > Viewer` or `Project > Editor` if you need to create sheets programmatically. For read/write access to specific sheets, `Project > Editor` is generally sufficient.
5. Click **CONTINUE**, then **DONE**.

## 3. Generate a Service Account Key

1. On the **Credentials** page, find your newly created service account under the "Service Accounts" section.
2. Click on the service account's email address.
3. Go to the **Keys** tab.
4. Click **ADD KEY > Create new key**.
5. Select **JSON** as the key type and click **CREATE**.
6. A JSON file will be downloaded to your computer. **Rename this file to `service-account-key.json`** and place it in the `config/` directory of your project.
   * **Important**: Do NOT commit this file directly to your public Git repository. Use environment variables for production.

## 4. Share Your Google Sheets with the Service Account

For the application to access your Google Sheets, you need to share them with the service account's email address.

1. Open your Google Sheet (e.g., your Credentials Sheet, Class Base Sheets).
2. Click the "Share" button.
3. In the "Share with people and groups" dialog, paste the **email address of your service account** (found on the Credentials page in Google Cloud Console).
4. Grant the service account **Editor** access.
5. Click "Share".

## 5. Configure Environment Variables

For production deployments (e.g., Vercel), it's recommended to use environment variables instead of the `service-account-key.json` file directly.

1. Open the `service-account-key.json` file you downloaded.
2. Copy its entire content.
3. Encode the JSON content into a Base64 string. You can use an online tool or a command-line utility:
   * **Linux/macOS**: `cat config/service-account-key.json | base64`
   * **Windows (PowerShell)**: `[System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes("config\service-account-key.json"))`
4. Set the following environment variables in your deployment environment (e.g., Vercel Project Settings):

   * `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`: The Base64 encoded string of your service account key JSON.
   * `CREDENTIALS_SPREADSHEET_ID`: The ID of your Google Sheet containing user credentials. You can find this in the URL of your spreadsheet (e.g., `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit`).
   * `CLASS_X_SPREADSHEET_ID`: For each class, set its corresponding spreadsheet ID. For example:
     * `CLASS_4_SPREADSHEET_ID=1ABC123_class4_spreadsheet_id`
     * `CLASS_5_SPREADSHEET_ID=1DEF456_class5_spreadsheet_id`
     * ...and so on for all your classes.

**Example `.env.local` (for local development, if not using Base64):**

\`\`\`
# For local development, you can point to the file path
# GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./config/service-account-key.json

# For production, use the Base64 encoded key
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64="YOUR_BASE64_ENCODED_KEY_HERE"

CREDENTIALS_SPREADSHEET_ID="YOUR_CREDENTIALS_SHEET_ID"
CLASS_4_SPREADSHEET_ID="YOUR_CLASS_4_SHEET_ID"
CLASS_5_SPREADSHEET_ID="YOUR_CLASS_5_SHEET_ID"
# ... add other class IDs
\`\`\`

**Note**: If `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` is set, the application will prioritize it over `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`.

## 6. Run the Application

After configuring the environment variables and sharing your sheets, you can run the application:

\`\`\`bash
npm install
npm run dev
\`\`\`

Your application should now be able to interact with your Google Sheets.

## 7. Sheet Structure

### Login Credentials Sheet
| Column A | Column B | Column C |
|----------|----------|----------|
| Username | Password | Role     |
| admin1   | admin123 | Admin    |
| judge1   | judge123 | Judge    |

### Class Project Sheets
| Column A  |
|-----------|
| ProjectID |
| P4001     |
| P4002     |
| P4003     |

## 8. Update Configuration

In `lib/google-sheets.ts`, update the `SPREADSHEET_CONFIG` with your actual spreadsheet IDs:

\`\`\`typescript
export const SPREADSHEET_CONFIG = {
  CREDENTIALS: {
    id: process.env.CREDENTIALS_SPREADSHEET_ID, // Your actual ID
    range: "Sheet1!A:C"
  },
  CLASSES: {
    "Class 4": { id: process.env.CLASS_4_SPREADSHEET_ID, range: "Sheet1!A:A" },
    "Class 5": { id: process.env.CLASS_5_SPREADSHEET_ID, range: "Sheet1!A:A" },
    // ... add all your class spreadsheet IDs
  }
}
\`\`\`

## 9. Install Dependencies

\`\`\`bash
npm install google-auth-library googleapis
\`\`\`

## 10. Test Connection

Run your application and check the console logs for successful API connections.

## Security Notes

- Never commit service account keys to version control
- Use environment variables for sensitive configuration
- Restrict service account permissions to minimum required
- Consider using Google Cloud Secret Manager for production
- Regularly rotate service account keys

## Troubleshooting

- **403 Forbidden**: Check if service account has access to the spreadsheet
- **404 Not Found**: Verify spreadsheet IDs are correct
- **Authentication Error**: Ensure service account key file path is correct
- **Empty Data**: Check if sheet has data and range is correct

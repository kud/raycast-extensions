import { ActionPanel, Action, Detail, getPreferenceValues, open } from "@raycast/api";

interface Preferences {
  clientId: string;
  clientSecret: string;
}

export default function OAuthGuide() {
  const handleOpenOAuth = async () => {
    const preferences = getPreferenceValues<Preferences>();
    const state = Math.random().toString(36).substring(7);
    const nonce = Math.random().toString(36).substring(7);

    const authUrl = new URL("https://api.whimsical.com/v1/oauth.authorize");
    authUrl.searchParams.set("client_id", preferences.clientId);
    authUrl.searchParams.set("redirect_uri", "https://oauthdebugger.com/debug");
    authUrl.searchParams.set("scope", "user:read profile team:read post:read project:read file:read");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("response_mode", "form_post");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("nonce", nonce);

    await open(authUrl.toString());
  };

  const markdown = `
# 🔐 Whimsical OAuth Setup Guide

Follow these steps to connect your Whimsical workspace:

## 📋 Prerequisites
- Whimsical Client ID and Client Secret (contact help@whimsical.com)
- Client credentials configured in Raycast Settings

## 🚀 Setup Steps

### 1. Open Authorization Page
Click the **"Open OAuth Page"** action below to start the flow.

### 2. Authorize the Application
- You'll be redirected to Whimsical's authorization page
- Log in with your Whimsical account
- Click **"Authorize"** to grant access

### 3. Get Your Authorization Code
- You'll be redirected to **oauthdebugger.com**
- Look for the **"code"** field on the page
- Copy the entire code value (starts with \`whco_\`)

### 4. Complete Setup
- Return to Raycast
- Run **"Setup OAuth Authentication"** command
- Paste your authorization code
- Submit to complete authentication

## 🔍 What to Look For

On oauthdebugger.com, you'll see something like:
\`\`\`
code: whco_ABC123XYZ789...
state: xyz123
\`\`\`

**Copy the entire \`code\` value** - this is your authorization code.

## ⚠️ Important Notes

- The authorization code **expires quickly** (usually within 10 minutes)
- Complete the setup process immediately after getting the code
- If the code expires, restart the process from step 1

## 🆘 Troubleshooting

**"Invalid redirect_uri" error?**
→ Make sure you're using the correct Client ID from Whimsical

**Code doesn't work?**
→ Check that you copied the complete code starting with \`whco_\`

**Still having issues?**
→ Contact Whimsical support at help@whimsical.com
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action title="Open OAuth Page" onAction={handleOpenOAuth} icon="🔗" />
          <Action.Push
            title="Go to Setup Form"
            target={
              <Detail markdown="Use the 'Setup OAuth Authentication' command from the main Whimsical extension menu." />
            }
            icon="⚙️"
          />
        </ActionPanel>
      }
    />
  );
}

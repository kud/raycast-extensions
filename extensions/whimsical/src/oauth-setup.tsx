import {
  ActionPanel,
  Action,
  Detail,
  showToast,
  Toast,
  popToRoot,
  getPreferenceValues,
  open,
  Form,
  useNavigation,
} from "@raycast/api";
import { useState } from "react";
import { exchangeCodeForToken, clearStoredCredentials } from "./oauth/utils";

interface Preferences {
  clientId: string;
  clientSecret: string;
}

function AuthCodeForm({ onSubmit }: { readonly onSubmit: (code: string) => void }) {
  const [authCode, setAuthCode] = useState("");
  const { pop } = useNavigation();

  const handleSubmit = () => {
    if (authCode.trim()) {
      onSubmit(authCode.trim());
      pop();
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit Code" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={pop} shortcut={{ modifiers: ["cmd"], key: "escape" }} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="authCode"
        title="Authorization Code"
        placeholder="Paste your authorization code here (e.g., whco_ABC123...)"
        value={authCode}
        onChange={setAuthCode}
        info="The authorization code from oauthdebugger.com after completing OAuth flow"
      />
      <Form.Description text="💡 Paste the 'code' value from oauthdebugger.com and submit" />
    </Form>
  );
}

interface Preferences {
  clientId: string;
  clientSecret: string;
}

export default function OAuthSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const { push } = useNavigation();

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

    await showToast({
      style: Toast.Style.Success,
      title: "OAuth Page Opened",
      message: "Authorize the app, then use 'Enter Auth Code' action",
    });
  };

  const handleEnterCode = () => {
    push(<AuthCodeForm onSubmit={handleCodeSubmit} />);
  };

  const handleCodeSubmit = async (authCode: string) => {
    if (!authCode.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No Code Entered",
        message: "Please try again and enter the authorization code",
      });
      return;
    }

    // Basic validation - Whimsical codes start with "whco_"
    if (!authCode.trim().startsWith("whco_")) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Code Format",
        message: "Authorization codes should start with 'whco_'. Please check and try again.",
      });
      return;
    }

    setIsLoading(true);

    try {
      await exchangeCodeForToken(authCode.trim());
      await showToast({
        style: Toast.Style.Success,
        title: "Authentication Successful",
        message: "You can now use Whimsical workspace features!",
      });
      await popToRoot();
    } catch (error) {
      console.error("OAuth error:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Authentication Failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCredentials = async () => {
    await clearStoredCredentials();
  };

  const markdown = `
# 🔐 Whimsical OAuth Setup

Complete your Whimsical OAuth authentication by following these steps:

## 📋 Prerequisites
- ✅ **Client ID** and **Client Secret** configured in Raycast Settings
- ✅ **Whimsical account** with workspace access

## 🚀 Authentication Steps

### **Step 1:** Open Authorization Page
Use **⌘+O** or click **"Open OAuth Page"** action to start the OAuth flow.

### **Step 2:** Authorize the Application
- You'll be redirected to Whimsical's authorization page
- Log in with your **Whimsical account**
- Click **"Authorize"** to grant access to your workspace

### **Step 3:** Get Your Authorization Code
- You'll be redirected to **oauthdebugger.com**
- Look for the **"code"** field on the page
- Copy the **entire code value** (starts with \`whco_\`)

### **Step 4:** Enter the Code
- Click **"Enter Authorization Code"** action below
- Paste your code when prompted
- Submit to complete authentication

## 🔍 What to Look For

On **oauthdebugger.com**, you'll see something like:

\`\`\`
code: whco_ABC123XYZ789...
state: xyz123
\`\`\`

**Copy the entire \`code\` value** - this is your authorization code.

## ⚠️ Important Notes

- ⏰ **Authorization codes expire quickly** (usually within 10 minutes)
- 🚀 **Complete the process immediately** after getting the code
- 🔄 **If the code expires**, restart from Step 1

## 🆘 Troubleshooting

**"Invalid redirect_uri" error?**
→ Make sure your Client ID is correct in Raycast Settings

**Code doesn't work?**
→ Check that you copied the complete code starting with \`whco_\`

**Still having issues?**
→ Contact Whimsical support at **help@whimsical.com**

---

**Ready to start?** Click **"Open OAuth Page"** below to begin! 🎉
`;

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action
            title="Open OAuth Page"
            onAction={handleOpenOAuth}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
            icon="🔗"
          />
          <Action
            title="Enter Authorization Code"
            onAction={handleEnterCode}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
            icon="🔑"
          />
          <Action
            title="Clear Stored Credentials"
            onAction={handleClearCredentials}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            style={Action.Style.Destructive}
            icon="🗑️"
          />
        </ActionPanel>
      }
    />
  );
}

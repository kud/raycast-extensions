import { LocalStorage, showToast, Toast, getPreferenceValues } from "@raycast/api";

interface Preferences {
  clientId: string;
  clientSecret: string;
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  user_id: string;
  workspace_id: string;
  user_name: string;
  workspace_name: string;
}

export async function exchangeCodeForToken(authorizationCode: string): Promise<OAuthTokenResponse> {
  const preferences = getPreferenceValues<Preferences>();

  const response = await fetch("https://api.whimsical.com/v1/oauth.token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: authorizationCode,
      client_id: preferences.clientId,
      client_secret: preferences.clientSecret,
      redirect_uri: "https://oauthdebugger.com/debug",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth token exchange failed: ${response.statusText}\n${errorText}`);
  }

  const tokenData = (await response.json()) as OAuthTokenResponse;

  // Store the access token
  await LocalStorage.setItem("whimsical_access_token", tokenData.access_token);
  await LocalStorage.setItem(
    "whimsical_user_info",
    JSON.stringify({
      user_id: tokenData.user_id,
      workspace_id: tokenData.workspace_id,
      user_name: tokenData.user_name,
      workspace_name: tokenData.workspace_name,
    }),
  );

  await showToast({
    style: Toast.Style.Success,
    title: "Authentication Successful",
    message: `Welcome, ${tokenData.user_name}!`,
  });

  return tokenData;
}

export async function clearStoredCredentials(): Promise<void> {
  await LocalStorage.removeItem("whimsical_access_token");
  await LocalStorage.removeItem("whimsical_user_info");
  await LocalStorage.removeItem("oauth_state");

  await showToast({
    style: Toast.Style.Success,
    title: "Credentials Cleared",
    message: "You can now re-authenticate with Whimsical",
  });
}

export async function getStoredUserInfo(): Promise<{
  user_id: string;
  workspace_id: string;
  user_name: string;
  workspace_name: string;
} | null> {
  const userInfoString = await LocalStorage.getItem<string>("whimsical_user_info");
  if (!userInfoString) return null;

  try {
    return JSON.parse(userInfoString);
  } catch {
    return null;
  }
}

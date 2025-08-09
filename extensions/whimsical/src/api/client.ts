import { getPreferenceValues, LocalStorage, open, showToast, Toast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";

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

interface ApiResponse<T> {
  results?: T[];
  next_cursor?: string | null;
}

interface WhimsicalFile {
  id: string;
  parent_id: string;
  title: string;
  url: string;
  file_type: string;
  created: string;
  updated: string;
  content?: string;
}

interface WhimsicalTeam {
  id: string;
  name: string;
  url: string;
}

interface WhimsicalProject {
  id: string;
  parent_id: string;
  name: string;
  url: string;
}

interface WhimsicalBlock {
  "block-id": string;
  tag: string;
  content: string;
  idx: string;
}

export class WhimsicalAPI {
  private readonly baseUrl = "https://api.whimsical.com/v1";
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;

  constructor() {
    const preferences = getPreferenceValues<Preferences>();
    this.clientId = preferences.clientId;
    this.clientSecret = preferences.clientSecret;
  }

  async initialize() {
    const token = await LocalStorage.getItem<string>("whimsical_access_token");
    this.accessToken = token || null;
    if (!this.accessToken) {
      await this.authenticate();
    }
  }

  private async authenticate() {
    try {
      // Generate OAuth URL
      const state = Math.random().toString(36).substring(7);
      const nonce = Math.random().toString(36).substring(7);

      await LocalStorage.setItem("oauth_state", state);

      const authUrl = new URL(`${this.baseUrl}/oauth.authorize`);
      authUrl.searchParams.set("client_id", this.clientId);
      authUrl.searchParams.set("redirect_uri", "https://oauthdebugger.com/debug");
      authUrl.searchParams.set("scope", "user:read profile team:read post:read project:read file:read");
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("response_mode", "form_post");
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("nonce", nonce);

      await showToast({
        style: Toast.Style.Animated,
        title: "Authentication Required",
        message: "Opening browser for OAuth setup",
      });

      await open(authUrl.toString());

      // Provide instructions for completing OAuth
      await showToast({
        style: Toast.Style.Failure,
        title: "Complete OAuth Setup",
        message: "Use 'Setup OAuth Authentication' command to finish",
      });

      throw new Error("Please complete OAuth authentication using the 'Setup OAuth Authentication' command");
    } catch (error) {
      console.error("Authentication error:", error);
      if (error instanceof Error && error.message.includes("complete OAuth")) {
        throw error;
      }
      await showFailureToast(error, { title: "Authentication failed" });
      throw error;
    }
  }

  private async makeRequest<T>(endpoint: string, data?: object): Promise<T> {
    if (!this.accessToken) {
      await this.initialize();
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear it and re-authenticate
        await LocalStorage.removeItem("whimsical_access_token");
        this.accessToken = null;
        throw new Error("Authentication required. Please re-authenticate.");
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // User methods
  async getUser(userId: string) {
    return this.makeRequest("/users.get", { id: userId });
  }

  // Team methods
  async listTeams(): Promise<WhimsicalTeam[]> {
    const response = await this.makeRequest<ApiResponse<WhimsicalTeam>>("/teams.list");
    return response.results || [];
  }

  // Project methods
  async listProjects(parentId: string): Promise<WhimsicalProject[]> {
    const response = await this.makeRequest<ApiResponse<WhimsicalProject>>("/projects.list", { parent_id: parentId });
    return response.results || [];
  }

  // File methods
  async listFiles(parentId: string, limit?: number, cursor?: string): Promise<ApiResponse<WhimsicalFile>> {
    const data: { parent_id: string; limit?: number; cursor?: string } = { parent_id: parentId };
    if (limit) data.limit = limit;
    if (cursor) data.cursor = cursor;

    return this.makeRequest<ApiResponse<WhimsicalFile>>("/files.list", data);
  }

  async getFile(id: string, includeContent = false, format = "markdown"): Promise<WhimsicalFile> {
    return this.makeRequest("/files.get", {
      id,
      include_content: includeContent,
      format,
    });
  }

  // Block methods
  async listBlocks(
    parentId: string,
    format = "markdown",
    limit?: number,
    cursor?: string,
  ): Promise<{ id: string; results: WhimsicalBlock[]; next_cursor?: string | null }> {
    const data: { parent_id: string; format?: string; limit?: number; cursor?: string } = {
      parent_id: parentId,
      format,
    };
    if (limit) data.limit = limit;
    if (cursor) data.cursor = cursor;

    return this.makeRequest("/blocks.list", data);
  }

  // Post methods
  async listPosts(parentId: string) {
    return this.makeRequest("/posts.list", { parent_id: parentId });
  }

  // Comment methods
  async listComments(parentId: string) {
    return this.makeRequest("/comments.list", { parent_id: parentId });
  }

  // Helper method to traverse workspace hierarchy
  async getAllFiles(): Promise<WhimsicalFile[]> {
    const allFiles: WhimsicalFile[] = [];

    try {
      const teams = await this.listTeams();

      for (const team of teams) {
        const files = await this.listFiles(team.id);
        allFiles.push(...(files.results || []));

        // Recursively get files from subdirectories
        const subdirectoryFiles = await this.getFilesRecursively(files.results || []);
        allFiles.push(...subdirectoryFiles);
      }
    } catch (error) {
      console.error("Error getting all files:", error);
      throw error;
    }

    return allFiles;
  }

  private async getFilesRecursively(files: WhimsicalFile[]): Promise<WhimsicalFile[]> {
    const allFiles: WhimsicalFile[] = [];

    for (const file of files) {
      // If it's a folder, get its contents
      if (file.file_type === "folder") {
        try {
          const subFiles = await this.listFiles(file.id);
          allFiles.push(...(subFiles.results || []));

          // Recursively get files from sub-folders
          const nestedFiles = await this.getFilesRecursively(subFiles.results || []);
          allFiles.push(...nestedFiles);
        } catch (error) {
          console.error(`Error getting files from folder ${file.id}:`, error);
        }
      }
    }

    return allFiles;
  }

  // Search functionality
  async searchFiles(query: string): Promise<WhimsicalFile[]> {
    const allFiles = await this.getAllFiles();
    const searchTerms = query.toLowerCase().split(" ");

    return allFiles.filter((file) => {
      const searchableText = `${file.title} ${file.file_type}`.toLowerCase();
      return searchTerms.every((term) => searchableText.includes(term));
    });
  }

  // Simplified content search to reduce complexity
  async searchFileContent(query: string): Promise<Array<WhimsicalFile & { matchedContent?: string }>> {
    const allFiles = await this.getAllFiles();
    const results: Array<WhimsicalFile & { matchedContent?: string }> = [];
    const searchTerms = query.toLowerCase().split(" ");

    for (const file of allFiles) {
      if (this.isSearchableFileType(file.file_type)) {
        const result = await this.searchSingleFileContent(file, searchTerms);
        if (result) {
          results.push(result);
        }
      }
    }

    return results;
  }

  private isSearchableFileType(fileType: string): boolean {
    return fileType === "doc" || fileType === "board";
  }

  private async searchSingleFileContent(
    file: WhimsicalFile,
    searchTerms: string[],
  ): Promise<(WhimsicalFile & { matchedContent?: string }) | null> {
    try {
      const fileWithContent = await this.getFile(file.id, true);
      if (!fileWithContent.content) return null;

      const contentLower = fileWithContent.content.toLowerCase();
      const titleMatch = searchTerms.every((term) => file.title.toLowerCase().includes(term));
      const contentMatch = searchTerms.every((term) => contentLower.includes(term));

      if (titleMatch || contentMatch) {
        const matchedContent = this.extractMatchedContent(fileWithContent.content, searchTerms);
        return {
          ...fileWithContent,
          matchedContent,
        };
      }
    } catch (error) {
      console.error(`Error searching content for file ${file.id}:`, error);
    }

    return null;
  }

  private extractMatchedContent(content: string, searchTerms: string[]): string {
    const contentLower = content.toLowerCase();
    for (const term of searchTerms) {
      const index = contentLower.indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + term.length + 50);
        return content.slice(start, end);
      }
    }
    return content.slice(0, 100) + "...";
  }
}

export const whimsicalAPI = new WhimsicalAPI();

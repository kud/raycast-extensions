import { List, Action, ActionPanel, showToast, Toast, Icon, Color, Detail } from "@raycast/api";
import { useState, useEffect } from "react";
import { useCachedPromise } from "@raycast/utils";
import { whimsicalAPI } from "./api/client";

interface Team {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  parent_id: string;
}

interface Post {
  id: string;
  title: string;
  url: string;
  parent_id: string;
}

interface WhimsicalFile {
  id: string;
  parent_id: string;
  title: string;
  url: string;
  file_type: string;
  created: string;
  updated: string;
}

type BrowseItem = {
  id: string;
  title: string;
  type: "team" | "project" | "folder" | "file" | "post";
  file_type?: string;
  url?: string;
  parent_id?: string;
  subtitle?: string;
  updated?: string;
  is_posts_folder?: boolean;
  posts?: Post[];
};

interface BrowseState {
  path: BrowseItem[];
  currentItems: BrowseItem[];
}

function getFileTypeEmoji(fileType: string, isPostsFolder?: boolean): string {
  switch (fileType) {
    case "doc":
      return "📄";
    case "board":
      return "🎨";
    case "flowchart":
      return "🔀";
    case "mindmap":
      return "🧠";
    case "wireframe":
      return "📱";
    case "folder":
      return isPostsFolder ? "📝" : "📁";
    case "post":
      return "📝";
    default:
      return "📋";
  }
}

function capitalizeFileType(fileType: string): string {
  switch (fileType) {
    case "doc":
      return "Document";
    case "board":
      return "Board";
    case "flowchart":
      return "Flowchart";
    case "mindmap":
      return "Mindmap";
    case "wireframe":
      return "Wireframe";
    case "folder":
      return "Folder";
    case "post":
      return "Post";
    default:
      return fileType ? fileType.charAt(0).toUpperCase() + fileType.slice(1) : "Unknown";
  }
}

export default function BrowseFiles() {
  const [isLoading, setIsLoading] = useState(true);
  const [browseState, setBrowseState] = useState<BrowseState>({
    path: [],
    currentItems: [],
  });
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadWorkspaceRoot();
  }, []);

  const loadWorkspaceRoot = async () => {
    try {
      setIsLoading(true);
      setError("");

      await whimsicalAPI.initialize();
      const teams = await whimsicalAPI.listTeams();

      if (teams.length === 0) {
        setError("No teams found in your workspace");
        setIsLoading(false);
        return;
      }

      const teamItems: BrowseItem[] = teams.map((team: Team) => ({
        id: team.id,
        title: team.name || "Unnamed Team",
        type: "team" as const,
        subtitle: "Team",
      }));

      setBrowseState({
        path: [],
        currentItems: teamItems,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load workspace";
      setError(errorMessage);
      await showToast({
        style: Toast.Style.Failure,
        title: "Error Loading Workspace",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamContent = async (teamId: string, teamName: string) => {
    try {
      setIsLoading(true);

      // Load projects, files/folders, and posts at team level
      const [projects, filesResult, postsResponse] = await Promise.all([
        whimsicalAPI.listProjects(teamId).catch(() => []), // Projects might not exist
        whimsicalAPI.listFiles(teamId).catch(() => ({ results: [] })), // Files/folders at team level
        whimsicalAPI.listPosts(teamId).catch(() => ({ results: [] })), // Posts at team level
      ]);

      const files = filesResult.results || [];

      // Handle different response formats for posts
      let posts: Post[] = [];
      if (postsResponse && typeof postsResponse === "object") {
        if ("results" in postsResponse && Array.isArray(postsResponse.results)) {
          posts = postsResponse.results;
        } else if (Array.isArray(postsResponse)) {
          posts = postsResponse;
        }
      }

      const items: BrowseItem[] = [
        ...projects.map((project: Project) => ({
          id: project.id,
          title: project.name || "Unnamed Project",
          type: "project" as const,
          parent_id: teamId,
          subtitle: `Project in ${teamName}`,
        })),
        // Add virtual Posts folder if there are posts
        ...(posts.length > 0
          ? [
              {
                id: `${teamId}-posts`,
                title: "Posts",
                type: "folder" as const,
                file_type: "folder" as const,
                parent_id: teamId,
                subtitle: `Posts folder in ${teamName}`,
                is_posts_folder: true,
                posts: posts,
              },
            ]
          : []),
        ...files.map((file: WhimsicalFile) => ({
          id: file.id,
          title: file.title || "Unnamed File",
          type: file.file_type === "folder" ? ("folder" as const) : ("file" as const),
          file_type: file.file_type,
          url: file.url,
          parent_id: file.parent_id,
          subtitle: `${capitalizeFileType(file.file_type || "unknown")} in ${teamName}`,
          updated: file.updated,
        })),
      ];

      setBrowseState({
        path: [...browseState.path, { id: teamId, title: teamName, type: "team" }],
        currentItems: items,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load team content";
      await showToast({
        style: Toast.Style.Failure,
        title: "Error Loading Team",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectContent = async (projectId: string, projectName: string) => {
    try {
      setIsLoading(true);

      // Load files and posts in this project
      const [filesResult, postsResponse] = await Promise.all([
        whimsicalAPI.listFiles(projectId).catch(() => ({ results: [] })), // Files in project
        whimsicalAPI.listPosts(projectId).catch(() => ({ results: [] })), // Posts in project
      ]);

      const files = filesResult.results || [];

      // Handle different response formats for posts
      let posts: Post[] = [];
      if (postsResponse && typeof postsResponse === "object") {
        if ("results" in postsResponse && Array.isArray(postsResponse.results)) {
          posts = postsResponse.results;
        } else if (Array.isArray(postsResponse)) {
          posts = postsResponse;
        }
      }

      const items: BrowseItem[] = [
        // Add virtual Posts folder if there are posts
        ...(posts.length > 0
          ? [
              {
                id: `${projectId}-posts`,
                title: "Posts",
                type: "folder" as const,
                file_type: "folder" as const,
                parent_id: projectId,
                subtitle: `Posts folder in ${projectName}`,
                is_posts_folder: true,
                posts: posts,
              },
            ]
          : []),
        // Add files and folders
        ...files.map((file: WhimsicalFile) => ({
          id: file.id,
          title: file.title || "Unnamed File",
          type: file.file_type === "folder" ? ("folder" as const) : ("file" as const),
          file_type: file.file_type,
          url: file.url,
          parent_id: file.parent_id,
          subtitle: `${capitalizeFileType(file.file_type || "unknown")} in ${projectName}`,
          updated: file.updated,
        })),
      ];

      setBrowseState({
        path: [...browseState.path, { id: projectId, title: projectName, type: "project" }],
        currentItems: items,
      });

      console.log(
        `Loaded project ${projectName} (${projectId}) with ${items.length} items:`,
        items.map((i) => ({ id: i.id, title: i.title, type: i.type })),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load project content";
      await showToast({
        style: Toast.Style.Failure,
        title: "Error Loading Project",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPostsFolder = (folderId: string, folderName: string, posts: Post[]) => {
    const items: BrowseItem[] = posts.map((post: Post) => ({
      id: post.id,
      title: post.title || "Unnamed Post",
      type: "post" as const,
      url: post.url,
      parent_id: post.parent_id,
      subtitle: `Post in ${folderName.replace(" Posts", "")}`,
    }));

    setBrowseState({
      path: [...browseState.path, { id: folderId, title: folderName, type: "folder" }],
      currentItems: items,
    });
  };

  const loadFolderContent = async (folderId: string, folderName: string) => {
    try {
      setIsLoading(true);

      // Load files/folders inside this folder
      const filesResult = await whimsicalAPI.listFiles(folderId);
      const files = filesResult.results || [];

      const items: BrowseItem[] = files.map((file: WhimsicalFile) => ({
        id: file.id,
        title: file.title || "Unnamed File",
        type: file.file_type === "folder" ? ("folder" as const) : ("file" as const),
        file_type: file.file_type,
        url: file.url,
        parent_id: file.parent_id,
        subtitle: `${capitalizeFileType(file.file_type || "unknown")} in ${folderName}`,
        updated: file.updated,
      }));

      setBrowseState({
        path: [...browseState.path, { id: folderId, title: folderName, type: "folder" }],
        currentItems: items,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load folder content";
      await showToast({
        style: Toast.Style.Failure,
        title: "Error Loading Folder",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateBack = () => {
    if (browseState.path.length === 0) return;

    const newPath = browseState.path.slice(0, -1);

    if (newPath.length === 0) {
      // Back to workspace root
      loadWorkspaceRoot();
    } else {
      // Navigate to parent
      const parent = newPath[newPath.length - 1];
      if (parent.type === "team") {
        loadTeamContent(parent.id, parent.title);
      } else if (parent.type === "project") {
        loadProjectContent(parent.id, parent.title);
      } else if (parent.type === "folder") {
        loadFolderContent(parent.id, parent.title);
      }
    }
  };

  const handleItemSelect = (item: BrowseItem) => {
    // Prevent infinite loops by checking if we're already in this item's path
    const isAlreadyInPath = browseState.path.some((pathItem) => pathItem.id === item.id);
    if (isAlreadyInPath) {
      showToast({
        style: Toast.Style.Failure,
        title: "Navigation Error",
        message: "Cannot navigate to an item that's already in the current path",
      });
      return;
    }

    if (item.type === "team") {
      loadTeamContent(item.id, item.title);
    } else if (item.type === "project") {
      loadProjectContent(item.id, item.title);
    } else if (item.type === "folder") {
      // Check if this is a posts folder
      if (item.is_posts_folder && item.posts) {
        loadPostsFolder(item.id, item.title, item.posts);
      } else {
        loadFolderContent(item.id, item.title);
      }
    }
    // Files and posts are handled by actions, not navigation
  };

  const getItemIcon = (item: BrowseItem): Icon => {
    switch (item.type) {
      case "team":
        return Icon.PersonLines;
      case "project":
        return Icon.Folder;
      case "folder":
        return item.is_posts_folder ? Icon.BulletPoints : Icon.Folder;
      case "post":
        return Icon.Document;
      case "file":
        switch (item.file_type) {
          case "doc":
            return Icon.Document;
          case "board":
            return Icon.AppWindow;
          case "flowchart":
            return Icon.BarChart;
          case "mindmap":
            return Icon.MemoryChip;
          case "wireframe":
            return Icon.Mobile;
          default:
            return Icon.Document;
        }
      default:
        return Icon.Document;
    }
  };

  const getItemColor = (item: BrowseItem): Color => {
    switch (item.type) {
      case "team":
        return Color.Blue;
      case "project":
        return Color.Orange;
      case "folder":
        return Color.SecondaryText;
      case "post":
        return Color.Green;
      case "file":
        switch (item.file_type) {
          case "doc":
            return Color.Blue;
          case "board":
            return Color.Orange;
          case "flowchart":
            return Color.Green;
          case "mindmap":
            return Color.Purple;
          case "wireframe":
            return Color.Yellow;
          default:
            return Color.PrimaryText;
        }
      default:
        return Color.PrimaryText;
    }
  };

  const getCurrentPath = (): string => {
    if (browseState.path.length === 0) return "Workspace";
    return browseState.path.map((item) => item.title).join(" › ");
  };

  const canNavigate = (item: BrowseItem): boolean => {
    return ["team", "project", "folder"].includes(item.type);
  };

  function formatDate(dateString?: string): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Error Loading Workspace"
          description={error}
          actions={
            <ActionPanel>
              <Action title="Retry" onAction={loadWorkspaceRoot} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search current level..." navigationTitle={getCurrentPath()}>
      {browseState.path.length > 0 && (
        <List.Item
          title="Back"
          subtitle={
            browseState.path.length === 1
              ? "to Workspace"
              : `to ${browseState.path[browseState.path.length - 2]?.title}`
          }
          icon={Icon.ArrowLeft}
          actions={
            <ActionPanel>
              <Action title="Go Back" onAction={navigateBack} />
              <Action
                title="Reset to Workspace Root"
                onAction={loadWorkspaceRoot}
                icon={Icon.House}
                shortcut={{ modifiers: ["cmd"], key: "h" }}
                style={Action.Style.Destructive}
              />
            </ActionPanel>
          }
        />
      )}

      {browseState.currentItems.length === 0 && !isLoading && (
        <List.EmptyView
          icon={Icon.Document}
          title="No Content Found"
          description="This location appears to be empty"
          actions={
            <ActionPanel>
              <Action
                title="Refresh"
                onAction={() => {
                  if (browseState.path.length === 0) {
                    loadWorkspaceRoot();
                  } else {
                    const current = browseState.path[browseState.path.length - 1];
                    if (current.type === "team") {
                      loadTeamContent(current.id, current.title);
                    } else if (current.type === "project") {
                      loadProjectContent(current.id, current.title);
                    } else if (current.type === "folder") {
                      loadFolderContent(current.id, current.title);
                    }
                  }
                }}
              />
            </ActionPanel>
          }
        />
      )}

      {browseState.currentItems.map((item) => (
        <List.Item
          key={item.id}
          title={item.title || "Unnamed Item"}
          subtitle={item.subtitle}
          accessories={[
            ...(item.updated ? [{ text: formatDate(item.updated) }] : []),
            {
              icon: {
                source: getItemIcon(item),
                tintColor: getItemColor(item),
              },
            },
          ]}
          actions={
            <ActionPanel>
              {canNavigate(item) && (
                <Action title="Open" icon={Icon.ArrowRight} onAction={() => handleItemSelect(item)} />
              )}
              {(item.type === "file" || item.type === "post") && (
                <Action.Push title="View Content" icon={Icon.Eye} target={<ViewFile file={item} />} />
              )}
              {item.url && (
                <Action.OpenInBrowser
                  title="Open in Whimsical"
                  url={item.url}
                  shortcut={{ modifiers: ["cmd"], key: "o" }}
                />
              )}
              {item.url && (
                <Action.CopyToClipboard
                  title="Copy URL"
                  content={item.url}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
              )}
              <Action
                title="Refresh"
                onAction={() => {
                  if (browseState.path.length === 0) {
                    loadWorkspaceRoot();
                  } else {
                    const current = browseState.path[browseState.path.length - 1];
                    if (current.type === "team") {
                      loadTeamContent(current.id, current.title);
                    } else if (current.type === "project") {
                      loadProjectContent(current.id, current.title);
                    } else if (current.type === "folder") {
                      // For posts folders, refresh by going back to team level
                      if (current.is_posts_folder) {
                        const parentPath = browseState.path[browseState.path.length - 2];
                        if (parentPath && parentPath.type === "team") {
                          loadTeamContent(parentPath.id, parentPath.title);
                        }
                      } else {
                        loadFolderContent(current.id, current.title);
                      }
                    }
                  }
                }}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
              />
              <Action
                title="Reset to Workspace Root"
                onAction={loadWorkspaceRoot}
                icon={Icon.House}
                shortcut={{ modifiers: ["cmd"], key: "h" }}
                style={Action.Style.Destructive}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

// ViewFile component for viewing file content
function ViewFile({ file }: { readonly file: BrowseItem }) {
  const {
    data: fileContent,
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(
    async (fileId: string, fileType: string) => {
      try {
        await whimsicalAPI.initialize();

        // Posts don't support the files API - return null to skip content loading
        if (file.type === "post") {
          return null;
        }

        // Only fetch content for file types that support it
        if (fileType === "doc" || fileType === "board") {
          const fileWithContent = await whimsicalAPI.getFile(fileId, true, "markdown");
          return fileWithContent;
        }

        // For other file types, just get basic file info
        const basicFile = await whimsicalAPI.getFile(fileId, false);
        return basicFile;
      } catch (error) {
        console.error("Error fetching file content:", error);
        throw error;
      }
    },
    [file.id, file.file_type || "unknown"],
    {
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load content",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      },
    },
  );

  if (error) {
    return (
      <Detail
        markdown="# ❌ Error Loading File\n\nFailed to load file content. Please check your connection and try again."
        actions={
          <ActionPanel>
            <Action title="Retry" onAction={revalidate} icon={Icon.ArrowClockwise} />
            {file.url && <Action.OpenInBrowser title="Open in Whimsical" url={file.url} />}
          </ActionPanel>
        }
      />
    );
  }

  // Prepare markdown content
  let markdown = `# ${file.title}\n\n`;

  // Add visual file type header with emoji
  if (file.file_type || file.type === "post") {
    const fileType = file.file_type || file.type || "unknown";
    const fileTypeEmoji = getFileTypeEmoji(fileType, file.is_posts_folder);
    const fileTypeDisplay = fileType.charAt(0).toUpperCase() + fileType.slice(1);
    markdown += `${fileTypeEmoji} **${fileTypeDisplay}**\n\n`;
  }

  // Add metadata in a visually appealing way
  markdown += `---\n\n`;

  if (file.updated) {
    const date = new Date(file.updated);
    markdown += `📅 **Last Updated:** ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n\n`;
  }

  if (file.url) {
    markdown += `🔗 **[Open in Whimsical ↗](${file.url})**\n\n`;
  }

  if (isLoading) {
    markdown += `⏳ **Loading content...**\n\n`;
    markdown += `> Please wait while we fetch the latest content from Whimsical.\n`;
  } else if (fileContent?.content) {
    markdown += `---\n\n## 📄 Content\n\n`;

    // Add a preview note for boards
    if (file.file_type === "board") {
      markdown += `> 💡 **Note:** This is a text representation of your visual board. For the full interactive experience with diagrams, images, and collaborative features, use the "Open in Whimsical" button above.\n\n`;
    }

    markdown += fileContent.content;
  } else {
    // Enhanced descriptions for different file types with better formatting
    const itemType = file.file_type || file.type;
    switch (itemType) {
      case "flowchart":
        markdown += `## 🔀 Flowchart Diagram\n\n`;
        markdown += `This is an interactive **flowchart** with connected nodes and decision paths.\n\n`;
        markdown += `**Features:**\n`;
        markdown += `• 📊 Process flow visualization\n`;
        markdown += `• 🔗 Connected decision points\n`;
        markdown += `• 🎯 Clear workflow representation\n\n`;
        markdown += `> 🚀 **[View Interactive Diagram →](${file.url})**`;
        break;
      case "mindmap":
        markdown += `## 🧠 Mind Map\n\n`;
        markdown += `This is an interactive **mind map** for organizing ideas and concepts.\n\n`;
        markdown += `**Perfect for:**\n`;
        markdown += `• 💡 Brainstorming sessions\n`;
        markdown += `• 🗂️ Knowledge organization\n`;
        markdown += `• 🎯 Project planning\n\n`;
        markdown += `> 🚀 **[Explore Mind Map →](${file.url})**`;
        break;
      case "wireframe":
        markdown += `## 📱 Wireframe Design\n\n`;
        markdown += `This is an interactive **wireframe** for UI/UX design and prototyping.\n\n`;
        markdown += `**Design elements:**\n`;
        markdown += `• 📐 Layout structure\n`;
        markdown += `• 🎨 User interface components\n`;
        markdown += `• 📱 Interactive prototyping\n\n`;
        markdown += `> 🚀 **[View Wireframe →](${file.url})**`;
        break;
      case "folder":
        markdown += `## 📁 Folder\n\n`;
        markdown += `This folder contains organized files and documents.\n\n`;
        markdown += `> 🔍 **Tip:** Use the "Browse Workspace" command to navigate into this folder and explore its contents.`;
        break;
      case "doc":
        markdown += `## 📄 Document\n\n`;
        markdown += `This is a **Whimsical document** with rich text content.\n\n`;
        markdown += `> 📖 **[Read Full Document →](${file.url})**`;
        break;
      case "board":
        // For boards, show a clean message encouraging interaction
        markdown += `> 🎨 **Interactive visual board** - Open in Whimsical for the full experience with diagrams, sticky notes, and real-time collaboration.\n`;
        break;
      case "post":
        // For posts, provide helpful information about what posts are
        markdown += `> 📝 **Collaborative post** - Open in Whimsical to view comments, participate in discussions, and see the full post content.\n`;
        break;
      default:
        markdown += `## 📋 ${file.file_type ? file.file_type.charAt(0).toUpperCase() + file.file_type.slice(1) : "File"}\n\n`;
        markdown += `> 🌐 **[Open in Whimsical →](${file.url})**\n\n`;
        markdown += `*This file type is best viewed in the full Whimsical interface.*`;
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="File ID" text={file.id} />
          {file.parent_id && <Detail.Metadata.Label title="Parent ID" text={file.parent_id} />}
          <Detail.Metadata.Separator />
          {file.file_type && <Detail.Metadata.Label title="Type" text={file.file_type} />}
          {fileContent?.created && <Detail.Metadata.Label title="Created" text={formatDate(fileContent.created)} />}
          {file.updated && <Detail.Metadata.Label title="Updated" text={formatDate(file.updated)} />}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          {file.url && <Action.OpenInBrowser title="🚀 Open in Whimsical" url={file.url} icon={Icon.Globe} />}
          {fileContent?.content && (
            <Action.CopyToClipboard
              title="📋 Copy Content"
              content={fileContent.content}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
              icon={Icon.Clipboard}
            />
          )}
          {file.url && (
            <Action.CopyToClipboard
              title="🔗 Copy URL"
              content={file.url}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              icon={Icon.Link}
            />
          )}
          <Action.CopyToClipboard
            title="🆔 Copy File ID"
            content={file.id}
            shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
            icon={Icon.Hashtag}
          />
          <Action
            title="🔄 Refresh"
            onAction={revalidate}
            icon={Icon.ArrowClockwise}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
        </ActionPanel>
      }
    />
  );
}

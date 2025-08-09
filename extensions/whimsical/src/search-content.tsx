import { ActionPanel, Action, List, Detail, showToast, Toast, Icon } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState, useEffect } from "react";
import { whimsicalAPI } from "./api/client";

interface WhimsicalFile {
  id: string;
  parent_id: string;
  title: string;
  url: string;
  file_type: string;
  created: string;
  updated: string;
  content?: string;
  matchedContent?: string;
}

function getFileIcon(fileType: string): Icon {
  switch (fileType) {
    case "doc":
      return Icon.Document;
    case "board":
      return Icon.AppWindow;
    case "folder":
      return Icon.Folder;
    case "flowchart":
      return Icon.BarChart;
    case "mindmap":
      return Icon.MemoryChip;
    case "wireframe":
      return Icon.Mobile;
    default:
      return Icon.Document;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
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

function SearchResultItem({ file }: { readonly file: WhimsicalFile & { matchedContent?: string } }) {
  const accessories = [{ text: capitalizeFileType(file.file_type) }, { text: formatDate(file.updated) }];

  // Create a more descriptive subtitle that includes parent info for better differentiation
  const getSubtitle = () => {
    if (file.matchedContent) {
      return truncateText(file.matchedContent, 100);
    }

    // For folders and files without matched content, show type and parent ID for better context
    const fileTypeText = capitalizeFileType(file.file_type);
    if (file.parent_id && file.parent_id !== "root") {
      return `${fileTypeText} (ID: ${file.parent_id.slice(-8)})`;
    }
    return fileTypeText;
  };

  return (
    <List.Item
      id={file.id}
      title={file.title}
      subtitle={getSubtitle()}
      icon={getFileIcon(file.file_type)}
      accessories={accessories}
      actions={
        <ActionPanel>
          <Action.Push title="View Content" icon={Icon.Eye} target={<ViewFileFromSearch file={file} />} />
          <Action.OpenInBrowser
            title="Open in Whimsical"
            url={file.url}
            icon={Icon.Globe}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
          />
          <Action.CopyToClipboard title="Copy URL" content={file.url} shortcut={{ modifiers: ["cmd"], key: "c" }} />
          <Action.CopyToClipboard
            title="Copy Matched Content"
            content={file.matchedContent || file.title}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          <Action.CopyToClipboard
            title="Copy File ID"
            content={file.id}
            shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}

export default function SearchContent() {
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<(WhimsicalFile & { matchedContent?: string })[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const { isLoading: isInitializing, error: initError } = useCachedPromise(
    async () => {
      await whimsicalAPI.initialize();
      return true;
    },
    [],
    {
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to initialize",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      },
    },
  );

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Searching...",
        message: `Looking for "${query}"`,
      });

      // First search file names and metadata
      const fileResults = await whimsicalAPI.searchFiles(query);

      // Then search file content for more detailed results
      const contentResults = await whimsicalAPI.searchFileContent(query);

      // Combine results, preferring content matches
      const combinedResults = new Map<string, WhimsicalFile & { matchedContent?: string }>();

      // Add content results first (higher priority)
      contentResults.forEach((file) => {
        combinedResults.set(file.id, file);
      });

      // Add file name results if not already included
      fileResults.forEach((file) => {
        if (!combinedResults.has(file.id)) {
          combinedResults.set(file.id, { ...file, matchedContent: undefined });
        }
      });

      const results = Array.from(combinedResults.values());

      setSearchResults(results);

      await toast.hide();

      if (results.length > 0) {
        await showToast({
          style: Toast.Style.Success,
          title: "Search Complete",
          message: `Found ${results.length} result${results.length === 1 ? "" : "s"}`,
        });
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "No Results",
          message: "No files found matching your search",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Search Failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.trim() && !isInitializing && !initError) {
        performSearch(searchText);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText, isInitializing, initError]);

  if (initError) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Error Initializing"
          description={initError instanceof Error ? initError.message : "Unknown error occurred"}
        />
      </List>
    );
  }

  const isLoading = isInitializing || isSearching;
  const showResults = hasSearched && searchText.trim();
  const showEmptySearch = !searchText.trim();
  const showNoResults = showResults && searchResults.length === 0 && !isLoading;

  function renderContent() {
    if (showEmptySearch) {
      return (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="Search Whimsical Content"
          description="Enter a search term to find content across your files, docs, and boards"
        />
      );
    }

    if (showNoResults) {
      return (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="No Results Found"
          description={`No content found for "${searchText}". Try different keywords or check your spelling.`}
        />
      );
    }

    if (showResults) {
      return (
        <List.Section title={`Search Results (${searchResults.length})`}>
          {searchResults.map((file) => (
            <SearchResultItem key={file.id} file={file} />
          ))}
        </List.Section>
      );
    }

    return null;
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search content in your Whimsical files..."
      searchText={searchText}
      onSearchTextChange={setSearchText}
      throttle
    >
      {renderContent()}
    </List>
  );
}

// ViewFileFromSearch component for viewing file content from search results
function ViewFileFromSearch({ file }: { readonly file: WhimsicalFile & { matchedContent?: string } }) {
  const {
    data: fileContent,
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(
    async (fileId: string, fileType: string) => {
      try {
        await whimsicalAPI.initialize();

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
    [file.id, file.file_type],
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
            <Action.OpenInBrowser title="Open in Whimsical" url={file.url} icon={Icon.Globe} />
          </ActionPanel>
        }
      />
    );
  }

  // Prepare markdown content
  let markdown = `# ${file.title}\n\n`;

  // Add file metadata
  const fileTypeDisplay = file.file_type.charAt(0).toUpperCase() + file.file_type.slice(1);
  markdown += `**File Type:** ${fileTypeDisplay}\n`;

  const date = new Date(file.updated);
  markdown += `**Updated:** ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n`;
  markdown += `**URL:** [Open in Whimsical](${file.url})\n\n`;

  // Show search match context if available
  if (file.matchedContent) {
    markdown += `**🔍 Search Match:**\n> ${file.matchedContent}\n\n`;
  }

  if (isLoading) {
    markdown += "⏳ Loading content...\n";
  } else if (fileContent?.content) {
    markdown += "---\n\n## Content\n\n";
    markdown += fileContent.content;
  } else {
    // Provide helpful information for different file types
    switch (file.file_type) {
      case "board":
        markdown +=
          "📊 **Whimsical Board**\n\nThis is a visual board (whiteboard/canvas). Use 'Open in Whimsical' to view the interactive content.\n";
        break;
      case "flowchart":
        markdown +=
          "🔀 **Flowchart**\n\nThis is a flowchart diagram. Use 'Open in Whimsical' to view the interactive diagram.\n";
        break;
      case "mindmap":
        markdown +=
          "🧠 **Mind Map**\n\nThis is a mind map. Use 'Open in Whimsical' to view the interactive mind map.\n";
        break;
      case "wireframe":
        markdown +=
          "📱 **Wireframe**\n\nThis is a wireframe/mockup. Use 'Open in Whimsical' to view the interactive wireframe.\n";
        break;
      case "folder":
        markdown +=
          "📁 **Folder**\n\nThis is a folder containing other files. Use 'Browse Workspace' to navigate to its contents.\n";
        break;
      default:
        markdown +=
          "*No content preview available for this file type. Use 'Open in Whimsical' to view the full content.*\n";
    }
  }

  const formatDateForMetadata = (dateString: string) => {
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
          <Detail.Metadata.Label title="Parent ID" text={file.parent_id} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Type" text={file.file_type} />
          {fileContent?.created && (
            <Detail.Metadata.Label title="Created" text={formatDateForMetadata(fileContent.created)} />
          )}
          <Detail.Metadata.Label title="Updated" text={formatDateForMetadata(file.updated)} />
          {file.matchedContent && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.Label title="Search Match" text="Found in content" />
            </>
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open in Whimsical" url={file.url} icon={Icon.Globe} />
          {fileContent?.content && (
            <Action.CopyToClipboard
              title="Copy Content"
              content={fileContent.content}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
            />
          )}
          <Action.CopyToClipboard
            title="Copy URL"
            content={file.url}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          {file.matchedContent && (
            <Action.CopyToClipboard
              title="Copy Search Match"
              content={file.matchedContent}
              shortcut={{ modifiers: ["cmd", "alt"], key: "c" }}
            />
          )}
          <Action.CopyToClipboard
            title="Copy File ID"
            content={file.id}
            shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
          />
          <Action
            title="Refresh"
            onAction={revalidate}
            icon={Icon.ArrowClockwise}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
        </ActionPanel>
      }
    />
  );
}

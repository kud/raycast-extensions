# Whimsical Changelog

## [Official API Version] - {PR_MERGE_DATE}

### Major Changes

- 🔄 **Complete Rewrite** - Migrated from AI diagram generation to official Whimsical Public API integration
- 🔐 **OAuth 2.1 Authentication** - Secure authentication with Whimsical workspace accounts
- 📁 **File Browser** - Browse all workspace files organized by type (documents, boards, flowcharts, mindmaps, wireframes)
- 🔍 **Full-Text Search** - Search across file names and content with real-time results
- 📊 **Content Preview** - View matched content snippets in search results

### Added

- **Browse Whimsical Files** command - Comprehensive file browser with type grouping and quick actions
- **Search Whimsical Content** command - Advanced search with content indexing and context snippets
- **Setup OAuth Authentication** command - Guided OAuth flow completion
- **About Whimsical API** command - Comprehensive documentation and setup instructions
- OAuth credential management with secure local storage
- Support for all Whimsical file types (docs, boards, flowcharts, mindmaps, wireframes, folders)
- Real-time search with debouncing and loading states
- Quick actions for opening files, copying URLs, and copying file IDs
- Error handling with user-friendly messages and retry options

### API Integration

- Complete Whimsical Public API client implementation
- Teams, Files, Blocks, Projects, Posts, and Comments API support
- Recursive file tree traversal for comprehensive workspace indexing
- Intelligent content search with snippet extraction
- Proper pagination support (when implemented by API)
- Comprehensive error handling and token management

### Security & Privacy

- OAuth 2.1 implementation with secure credential storage
- Local token caching with automatic expiration handling
- HTTPS-only communication with Whimsical servers
- No data storage outside local Raycast cache

### Removed

- AI diagram generation tool (replaced with official API integration)
- Dependency on Raycast AI features
- Anonymous usage without authentication

## [Initial Version] - Previous

### Added

- 🎨 **Smart AI Diagram Generation** - Automatically detects and creates the best diagram type from natural language descriptions
- 🔄 **Flowchart Creation** - Generate process flows, workflows, and decision trees using Mermaid syntax
- 🧠 **Mindmap Generation** - Create hierarchical mind maps for brainstorming and idea organization
- 📊 **Sequence Diagrams** - Build system interaction diagrams for APIs and communication flows
- ✨ **Intelligent Summarization** - AI provides clear descriptions of generated diagrams
- 🔗 **Direct Whimsical Integration** - Seamless rendering using Whimsical's public API
- 📱 **Clean User Experience** - Streamlined output with direct links to edit diagrams
- ⚡ **Zero Configuration** - No authentication or setup required
- 🎯 **Context-Aware Prompts** - Specialized AI prompts optimized for each diagram type

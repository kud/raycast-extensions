# Whimsical Extension for Raycast

The ultimate Whimsical integration combining **AI-powered diagram generation** with **full workspace API access**. Get the best of both worlds - instant AI diagrams and comprehensive workspace management.

## 🎯 Dual Functionality

### 🤖 AI Diagram Generation

- **Zero Setup** - Works instantly with Raycast AI
- **Smart Detection** - AI chooses the best diagram type
- **Professional Quality** - Powered by Whimsical's rendering engine

### 🔍 Workspace Integration

- **Full API Access** - Browse, search, and view all your files
- **OAuth 2.1 Security** - Secure authentication with your workspace
- **Rich Content** - View formatted documents and file structure

---

## ✨ AI Diagram Features

### How It Works

1. **Open Raycast AI Chat** (⌘ + Space, then type "AI")
2. **Select "Whimsical Diagram" tool** from available tools
3. **Describe your idea** in natural language
4. **Get instant professional diagrams**

### Supported Types

- **🔄 Flowcharts** - Processes, workflows, decision trees
- **🧠 Mindmaps** - Brainstorming, idea organization
- **📊 Sequence Diagrams** - System interactions, API flows

### Example Prompts

- "Create a user onboarding process flowchart"
- "Brainstorm marketing strategies for a SaaS product"
- "Show the authentication flow for a mobile app"
- "Design a customer support workflow"

---

## 📁 Workspace API Features

### Commands Available

#### **View File Content**

- Browse files with rich content preview
- View documents with proper formatting and block structure
- Quick actions to open, copy, and share files

#### **Browse Whimsical Files**

- Organized file browser with type grouping (docs, boards, flowcharts, etc.)
- Smart filtering and real-time search
- Recent files first with quick access actions

#### **Search Whimsical Content**

- Full-text search across file names and content
- Real-time results with matched content snippets
- Combined metadata and content search

#### **Setup OAuth Authentication**

- Guided OAuth 2.1 setup flow
- Secure credential management
- One-time setup with persistent authentication

### Supported File Types

- **📄 Documents** - Rich text documents with full content search
- **🖼️ Boards** - Visual boards with various content types
- **🔄 Flowcharts** - Process and workflow diagrams
- **🧠 Mindmaps** - Hierarchical idea maps
- **📱 Wireframes** - UI/UX design mockups
- **📁 Folders** - Organization containers

---

## 🚀 Getting Started

### AI Diagrams (Instant - No Setup)

1. Open Raycast AI Chat
2. Select "Whimsical Diagram" tool
3. Describe your diagram idea
4. Get instant professional results!

### Workspace Access (One-Time Setup)

#### 1. Get OAuth Credentials

Contact Whimsical support at **help@whimsical.com** to request API access. You'll receive:

- **Client ID**
- **Client Secret**

#### 2. Configure Extension

1. Open Raycast Settings (⌘ + ,)
2. Go to Extensions → Whimsical
3. Enter your Client ID and Client Secret

#### 3. Complete Authentication

1. Run **"Setup OAuth Authentication"** command
2. Use ⌘+O to open the OAuth page or use the action
3. Log in and authorize the application
4. Copy the authorization code from oauthdebugger.com
5. Paste it back into the extension

#### 4. Start Using

- Browse your workspace files
- Search content across all files
- View rich file content with formatting

---

## 💡 Usage Tips

### For AI Diagrams

- **Be specific** - Include key steps, components, or participants
- **Use action words** - "process", "flow", "interaction", "strategy"
- **Add context** - Mention domain, industry, or specific use case

### For Workspace Browsing

- **Use search** to quickly filter files by name, type, or content
- **Use keyboard shortcuts** for quick actions (copy, open, etc.)
- **View content** to see formatted documents without leaving Raycast

---

## 🔐 Privacy & Security

### AI Diagram Generation

- Uses Raycast AI and Whimsical's public rendering API
- No authentication or personal data required
- Diagrams created anonymously

### Workspace API Integration

- OAuth 2.1 secure authentication
- Credentials stored locally only in Raycast
- HTTPS-only communication with Whimsical servers
- No data stored outside of local Raycast cache

---

## 🛠 API Integration Details

Uses the official Whimsical Public API endpoints:

- **Teams API** - List workspace teams
- **Files API** - Browse and retrieve file content
- **Blocks API** - Access document content blocks
- **Projects API** - List team projects
- **Posts and Comments** - Access collaborative content

---

## 🆘 Troubleshooting

### AI Diagram Issues

- Ensure Raycast AI features are enabled
- Check your internet connection
- Try more specific or detailed prompts

### API Authentication Issues

- Verify your Client ID and Client Secret are correct
- Use the "Setup OAuth Authentication" command to re-authenticate
- Ensure you have proper permissions in your Whimsical workspace

### Search/Browse Problems

- Check your internet connection
- Verify your OAuth token hasn't expired (re-run setup if needed)
- Try shorter, more specific search terms

---

## 📋 Requirements

### For AI Diagrams

- Raycast with AI features enabled
- Internet connection

### For Workspace Access

- Whimsical account with API access
- OAuth credentials from Whimsical support

Both features can be used independently - AI diagrams work without any setup, while workspace features require one-time OAuth configuration.

---

## 🎯 Perfect For

**Developers, designers, project managers, consultants, educators, and anyone who:**

- Thinks visually and needs quick diagram creation
- Works with Whimsical and wants better access to their content
- Values both instant AI generation and comprehensive workspace management

---

**Need help?** Contact Whimsical support at **help@whimsical.com** or check the extension's repository for updates.

**Note:** The Whimsical Public API is currently under construction. Report any bugs or feedback to help@whimsical.com.

import { Detail } from "@raycast/api";

export default function Command() {
  const markdown = `
# 🎨 Whimsical Extension for Raycast

The ultimate Whimsical integration! This extension combines **AI-powered diagram generation** with **full workspace API access** to give you the best of both worlds.

## ✨ Dual Functionality

### 🤖 AI Diagram Generation (Raycast AI Tool)
Generate professional diagrams instantly using AI - no authentication required!

### 🔍 Workspace Browser & Search (API Commands)
Browse and search your entire Whimsical workspace with full API integration.

---

## 🎯 AI Diagram Generation

### How It Works
1. **Open Raycast AI Chat** (⌘ + Space, then type "AI")
2. **Select "Whimsical Diagram" tool** from available tools
3. **Describe your idea** in natural language
4. **Get instant diagrams** - AI chooses the best type and creates it

### Supported Diagram Types
- **🔄 Flowcharts** - Processes, workflows, decision trees
- **🧠 Mindmaps** - Brainstorming, idea organization, concept mapping
- **📊 Sequence Diagrams** - System interactions, API flows, communication

### Example Prompts
- "Create a user onboarding process flowchart"
- "Brainstorm marketing strategies for a SaaS product"
- "Show the API authentication flow for a mobile app"

### ⚡ **No Setup Required** - Uses Raycast AI + Whimsical's public rendering API

---

## 📁 Workspace Integration

### Available Commands

#### **View File Content**
- Browse all workspace files with rich content preview
- View documents with proper formatting and block structure
- Quick actions to open, copy, and share

#### **Browse Whimsical Files**
- Organized file browser with type grouping
- Smart filtering and search
- Recent files first, quick access actions

#### **Search Whimsical Content**
- Full-text search across file names and content
- Real-time results with content snippets
- Combined metadata and content search

#### **Setup OAuth Authentication**
- Guided OAuth 2.1 setup flow
- Secure credential management
- One-time setup with persistent authentication

### 🛠 API Setup (One-Time)

1. **Get OAuth Credentials**
   - Contact Whimsical support: **help@whimsical.com**
   - Request API access for your workspace
   - Receive Client ID and Client Secret

2. **Configure Extension**
   - Open Raycast Settings (⌘ + ,)
   - Go to Extensions → Whimsical
   - Enter your Client ID and Client Secret

3. **Complete Authentication**
   - Run "Setup OAuth Authentication" command
   - Follow guided OAuth flow
   - Authorize application in browser

### 📋 Supported File Types
- **📄 Documents** - Rich text with full content search
- **🖼️ Boards** - Visual boards with various content
- **🔄 Flowcharts** - Process diagrams
- **🧠 Mindmaps** - Hierarchical idea maps
- **📱 Wireframes** - UI/UX mockups
- **📁 Folders** - Organization containers

---

## 🚀 Getting Started

### For AI Diagrams (Instant)
1. Open Raycast AI Chat
2. Select Whimsical Diagram tool
3. Describe your diagram idea
4. Get instant results!

### For Workspace Access (Setup Required)
1. Get OAuth credentials from Whimsical
2. Configure extension preferences
3. Complete OAuth authentication
4. Start browsing your workspace!

---

## 💡 Pro Tips

### AI Diagram Generation
- **Be specific** - Include key steps, components, participants
- **Use action words** - "process", "flow", "interaction", "strategy"
- **Add context** - Mention domain, industry, or use case

### Workspace Browsing
- **Use search** - Filter files by name, type, or content
- **Quick actions** - Use keyboard shortcuts for common tasks
- **Content preview** - View formatted content without leaving Raycast

---

## 🔐 Privacy & Security

### AI Diagrams
- Uses Raycast AI and Whimsical's public rendering API
- No authentication or personal data required
- Diagrams created anonymously

### Workspace API
- OAuth 2.1 secure authentication
- Credentials stored locally only
- HTTPS-only communication
- No data stored outside Raycast cache

---

## 🆘 Need Help?

### AI Diagram Issues
- Ensure Raycast AI features are enabled
- Try more specific prompts
- Check your internet connection

### API Authentication Issues
- Verify Client ID and Client Secret
- Use "Setup OAuth Authentication" command
- Contact Whimsical support: **help@whimsical.com**

### Missing Features
- AI diagrams work without any setup
- API features require one-time OAuth setup
- Both can be used independently

---

**Perfect for:** Developers, designers, project managers, consultants, educators, and anyone who thinks visually and works with Whimsical!
  `;

  return <Detail markdown={markdown} />;
}

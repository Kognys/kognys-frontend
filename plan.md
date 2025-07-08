# Kognys Agents Frontend Integration Plan

## Project Overview

Build a frontend for Kognys - a living intelligence network where AI agents collaborate to build and share a real-time knowledge graph. The frontend will have two main phases:

1. **Initial Chat Page**: Full-screen chat interface for user interaction (the one that already exists)
2. **Dual-Pane Interface**: Split-screen with chat on left, interactive knowledge graph on right

## Backend API Details

**Base URL**: `kognys-agents-production.up.railway.app`

### Chat API Endpoints
- `POST /api/chat/session` - Create new chat session
- `POST /api/chat` - Send message and get AI response
- `POST /api/chat/stream` - Stream AI response using Server-Sent Events
- `GET /api/chat/history/:sessionId` - Get chat history
- `DELETE /api/chat/session/:sessionId` - End session

### Knowledge API Endpoints
- `GET /api/knowledge` - Get recent knowledge entries (query: `limit=1-100`)
- `GET /api/knowledge/:id` - Get specific knowledge entry
- `POST /api/knowledge` - Store new knowledge (body: `{ipfsHash}`)
- `GET /api/knowledge/stats/info` - Get system statistics

### WebSocket Events (namespace: `/chat`)
- `connect` - Connect to chat namespace
- `join` - Join session room (emit: `{sessionId}`)
- `chat:message` - Send message (emit: `{sessionId, message}`)
- `chat:stream:start` - Start streaming response
- `chat:stream:chunk` - Receive response chunks
- `chat:stream:complete` - Complete response received
- `knowledge:updated` - Knowledge graph updated
- `chat:insight` - New insight generated

## Phase 1: Initial Chat Page

### Technical Implementation

#### 1. Session Setup
```javascript
// Create new chat session
const createSession = async () => {
  const response = await fetch('/api/chat/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      preferences: { language: 'en' } 
    })
  });
  const session = await response.json();
  return session.sessionId;
};
```

#### 2. WebSocket Connection
```javascript
// Connect to WebSocket for real-time chat
import { io } from 'socket.io-client';

const socket = io('/chat');
socket.on('connect', () => {
  socket.emit('join', { sessionId });
});

// Listen for streaming responses
socket.on('chat:stream:chunk', (chunk) => {
  appendToCurrentMessage(chunk.content);
});

socket.on('chat:stream:complete', (response) => {
  finalizeMessage(response);
});
```

#### 3. Message Handling
```javascript
// Send message via WebSocket
const sendMessage = (message) => {
  socket.emit('chat:message', {
    sessionId,
    message
  });
  
  // Add user message to UI immediately
  addMessageToUI({
    role: 'user',
    content: message,
    timestamp: new Date()
  });
};
```

## Phase 2: Dual-Pane Interface

### Layout Design
```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│       Chat          │   Knowledge Graph   │
│    (Left 50%)       │    (Right 50%)      │
│                     │                     │
│  - Message history  │  - Interactive graph│
│  - Input field      │  - Node search      │
│  - Streaming        │  - Relationship vis │
│  - Context pills    │  - Real-time updates│
│                     │                     │
└─────────────────────┴─────────────────────┘
```

### Knowledge Graph Implementation

#### 1. Graph Data Structure
```javascript
// Knowledge graph data format
const graphData = {
  nodes: [
    {
      id: 'node1',
      type: 'concept', // 'concept', 'insight', 'conversation', 'contract'
      title: 'Blockchain Basics',
      content: 'Summary of blockchain concepts...',
      timestamp: '2024-01-01T00:00:00Z',
      size: 10 // Relevance/importance score
    }
  ],
  edges: [
    {
      source: 'node1',
      target: 'node2',
      type: 'related-to', // 'related-to', 'derived-from', 'mentioned-in'
      weight: 0.8
    }
  ]
};
```

#### 2. Graph Visualization (use D3.js or Cytoscape.js)
```javascript
// Initialize graph visualization
const initializeGraph = (containerId) => {
  const cy = cytoscape({
    container: document.getElementById(containerId),
    elements: graphData,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#666',
          'label': 'data(title)',
          'color': '#fff',
          'font-size': '12px'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 'data(weight)',
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle'
        }
      }
    ],
    layout: {
      name: 'force-directed',
      animate: true
    }
  });
  
  // Add click handlers
  cy.on('tap', 'node', handleNodeClick);
  cy.on('tap', 'edge', handleEdgeClick);
  
  return cy;
};
```

#### 3. Real-time Graph Updates
```javascript
// Listen for knowledge updates
socket.on('knowledge:updated', (data) => {
  addGraphNode(data.knowledge);
  animateNewConnection(data.relationships);
});

// Update graph when chat generates insights
socket.on('chat:insight', (insight) => {
  const node = createInsightNode(insight);
  connectToRelevantNodes(node, insight.context);
});

// Add new node to graph
const addGraphNode = (knowledge) => {
  const node = {
    group: 'nodes',
    data: {
      id: knowledge.id,
      title: knowledge.title,
      content: knowledge.content,
      type: knowledge.type
    }
  };
  
  cy.add(node);
  cy.layout({ name: 'force-directed' }).run();
};
```

#### 4. Graph Search & Interaction
```javascript
// Search knowledge graph
const searchGraph = async (query) => {
  const results = await fetch(`/api/knowledge/search?q=${query}`);
  const matches = await results.json();
  
  // Highlight matching nodes
  cy.nodes().removeClass('highlighted');
  matches.forEach(match => {
    cy.getElementById(match.id).addClass('highlighted');
  });
  
  return matches;
};

// Handle node click
const handleNodeClick = (event) => {
  const node = event.target;
  const nodeData = node.data();
  
  // Show node details in sidebar
  showNodeDetails(nodeData);
  
  // Highlight connected nodes
  const connectedNodes = node.neighborhood();
  connectedNodes.addClass('connected');
  
  // Option to start chat about this topic
  suggestChatTopic(nodeData.content);
};
```

### Enhanced Chat Integration

#### 1. Context Pills
```javascript
// Show relevant knowledge used in response
const showContextPills = (context) => {
  const pills = context.knowledgeUsed.map(knowledge => ({
    id: knowledge.id,
    title: knowledge.title,
    onClick: () => highlightGraphNode(knowledge.id)
  }));
  
  renderContextPills(pills);
};
```

#### 2. Prompt Processing with Graph Updates
```javascript
// Enhanced prompt processing
const processUserPrompt = async (message, sessionId) => {
  // Send message via WebSocket
  socket.emit('chat:message', { sessionId, message });
  
  // Listen for response and graph updates
  socket.on('chat:stream:complete', (response) => {
    // Update chat UI
    addAssistantMessage(response);
    
    // Show context pills
    showContextPills(response.context);
    
    // Update graph with new insights
    if (response.insights) {
      updateGraphWithInsights(response.insights);
    }
    
    // Highlight relevant nodes
    highlightRelevantNodes(response.context.knowledgeUsed);
  });
};
```

## Technical Stack Recommendations

### Frontend Framework
- **React** with TypeScript for type safety
- **Socket.io-client** for WebSocket connections
- **D3.js** or **Cytoscape.js** for graph visualization
- **Tailwind CSS** for styling

### Key Libraries
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "socket.io-client": "^4.7.0",
    "cytoscape": "^3.26.0",
    "d3": "^7.8.0",
    "tailwindcss": "^3.3.0"
  }
}
```
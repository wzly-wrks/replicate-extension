# Architecture Documentation

## System Overview

The SillyTavern Replicate Integration consists of two main components that work together to provide seamless image generation capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                        SillyTavern                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐         ┌──────────────────────┐ │
│  │   UI Extension       │         │   Server Plugin      │ │
│  │   (Frontend)         │◄───────►│   (Backend)          │ │
│  │                      │         │                      │ │
│  │  - Settings UI       │         │  - API Routes        │ │
│  │  - Slash Commands    │         │  - Replicate API     │ │
│  │  - Event Handlers    │         │  - Polling Logic     │ │
│  └──────────────────────┘         └──────────────────────┘ │
│           │                                 │               │
└───────────┼─────────────────────────────────┼───────────────┘
            │                                 │
            │                                 │
            └─────────────┬───────────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │  Replicate API   │
                │  (External)      │
                └──────────────────┘
```

## Component Architecture

### 1. Server Plugin (`plugin/`)

**Purpose**: Backend API integration and secure communication with Replicate

**Key Responsibilities**:
- Handle API authentication
- Manage prediction lifecycle
- Poll for completion
- Error handling and validation
- Expose REST endpoints

**Technology Stack**:
- Node.js
- Express.js
- node-fetch

**Endpoints**:
```
GET  /api/plugins/replicate/health
GET  /api/plugins/replicate/config
POST /api/plugins/replicate/config
GET  /api/plugins/replicate/models
POST /api/plugins/replicate/generate
GET  /api/plugins/replicate/prediction/:id
```

**Data Flow**:
```
Client Request → Plugin Route → Replicate API → Poll for Result → Return to Client
```

### 2. UI Extension (`extension/`)

**Purpose**: Frontend interface and user interaction

**Key Responsibilities**:
- Render settings UI
- Handle user input
- Manage extension state
- Register slash commands
- Display generation results

**Technology Stack**:
- Vanilla JavaScript
- SillyTavern API
- jQuery (via SillyTavern)

**UI Components**:
- Settings panel
- Model selector
- Parameter controls
- Status indicators
- Action buttons

**State Management**:
```javascript
extensionSettings = {
    apiKey: '',
    selectedModel: '',
    width: 1024,
    height: 1024,
    num_outputs: 1,
    guidance_scale: 7.5,
    num_inference_steps: 50
}
```

## Communication Flow

### Image Generation Flow

```
1. User Input
   └─> /replicate command or API call

2. Extension Processing
   └─> Validate input
   └─> Prepare request

3. Plugin Request
   └─> POST /api/plugins/replicate/generate
   └─> Validate API key
   └─> Create Replicate prediction

4. Replicate API
   └─> Queue prediction
   └─> Start processing
   └─> Generate image

5. Polling Loop
   └─> GET /predictions/{id}
   └─> Check status
   └─> Wait if processing
   └─> Return when complete

6. Response
   └─> Extract image URLs
   └─> Return to extension
   └─> Display in UI
```

### Configuration Flow

```
1. User enters API key in UI
   └─> Extension stores in settings

2. User clicks "Test Connection"
   └─> POST /api/plugins/replicate/config
   └─> Plugin stores configuration
   └─> GET /api/plugins/replicate/health
   └─> Verify connectivity

3. User clicks "Save Settings"
   └─> Extension persists to SillyTavern
   └─> Plugin updates internal config
```

## Data Models

### Prediction Request
```javascript
{
  prompt: string,           // Required
  model: string,            // Model ID
  width: number,            // 256-2048
  height: number,           // 256-2048
  num_outputs: number,      // 1-4
  guidance_scale: number,   // 1-20
  num_inference_steps: number // 1-100
}
```

### Prediction Response
```javascript
{
  images: string[],         // Array of image URLs
  prompt: string,           // Original prompt
  model: string,            // Model used
  predictionId: string      // Replicate prediction ID
}
```

### Health Check Response
```javascript
{
  status: 'ok',
  configured: boolean,
  defaultModel: string
}
```

## Security Architecture

### API Key Management

```
┌─────────────────────────────────────────────┐
│  User enters API key in UI                  │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Extension stores in extensionSettings      │
│  (SillyTavern's secure storage)             │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Plugin receives key via POST /config       │
│  (Server-side only, never exposed)          │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Plugin uses key for Replicate API calls    │
│  (HTTPS communication)                      │
└─────────────────────────────────────────────┘
```

### Security Features

1. **No Client-Side Token Exposure**
   - API key never sent to browser
   - All API calls go through backend

2. **Input Validation**
   - Parameter bounds checking
   - Type validation
   - Sanitization

3. **Error Handling**
   - No sensitive data in error messages
   - Proper HTTP status codes
   - Logging without exposing secrets

## Extension Lifecycle

### Initialization
```javascript
1. Extension loads
   └─> Load saved settings
   └─> Create UI elements
   └─> Bind event handlers
   └─> Register slash commands

2. Check plugin health
   └─> Verify plugin is running
   └─> Load available models
   └─> Update UI state
```

### Runtime
```javascript
1. User interaction
   └─> Update settings
   └─> Trigger generation
   └─> View results

2. Background tasks
   └─> Auto-save settings
   └─> Update status
   └─> Handle events
```

### Cleanup
```javascript
1. Extension unload
   └─> Save final state
   └─> Remove event listeners
   └─> Clean up resources
```

## Plugin Lifecycle

### Initialization
```javascript
async function init(router) {
  1. Load configuration
  2. Register routes
  3. Set up middleware
  4. Log initialization
  5. Return promise
}
```

### Runtime
```javascript
1. Handle incoming requests
   └─> Validate input
   └─> Process request
   └─> Call Replicate API
   └─> Return response

2. Manage predictions
   └─> Create predictions
   └─> Poll for status
   └─> Handle completion
   └─> Handle errors
```

### Cleanup
```javascript
async function exit() {
  1. Close connections
  2. Clean up resources
  3. Log shutdown
  4. Return promise
}
```

## Error Handling Strategy

### Extension Errors
```javascript
try {
  // Operation
} catch (error) {
  console.error('[Replicate Extension]', error);
  // Show user-friendly message
  // Update UI status
  // Don't crash extension
}
```

### Plugin Errors
```javascript
try {
  // Operation
} catch (error) {
  console.error('[Replicate Plugin]', error);
  // Return appropriate HTTP status
  // Include error message
  // Log details
  // Don't expose sensitive data
}
```

## Performance Considerations

### Polling Strategy
- Initial poll: Immediate
- Subsequent polls: 2 second intervals
- Maximum attempts: 60 (2 minutes)
- Timeout handling: Graceful failure

### Caching
- Model list cached after first load
- Settings cached in memory
- No image caching (URLs expire)

### Optimization
- Debounced settings save
- Lazy UI updates
- Efficient DOM manipulation
- Minimal API calls

## Extensibility

### Adding New Models
```javascript
// In plugin/index.js
const models = [
  {
    id: 'owner/model-name',
    name: 'Display Name',
    description: 'Description'
  }
];
```

### Adding New Parameters
```javascript
// 1. Add to extension settings
extensionSettings.newParam = defaultValue;

// 2. Add UI control
<input id="replicate_new_param" />

// 3. Include in request
body: JSON.stringify({
  ...existingParams,
  newParam: extensionSettings.newParam
})
```

### Adding New Endpoints
```javascript
// In plugin/index.js
router.get('/new-endpoint', async (req, res) => {
  // Implementation
});
```

## Testing Strategy

### Unit Testing
- Test individual functions
- Mock external dependencies
- Validate input/output

### Integration Testing
- Test plugin endpoints
- Test extension UI
- Test full generation flow

### Manual Testing
- Test all UI controls
- Test error scenarios
- Test edge cases
- Test different models

## Deployment Considerations

### Requirements
- Node.js 14+
- SillyTavern latest
- Internet connectivity
- Replicate account

### Configuration
- Environment variables
- config.yaml settings
- Extension settings

### Monitoring
- Server logs
- Browser console
- Error tracking
- Usage metrics

## Future Enhancements

### Planned Features
- Webhook support
- Image-to-image
- Batch processing
- Generation history
- Cost tracking
- Advanced templates

### Scalability
- Request queuing
- Rate limiting
- Caching layer
- Load balancing

---

**Last Updated**: 2025-01-14  
**Version**: 1.0.0
# Design Document

## Overview

This feature adds GitHub Pages deployment functionality to the Projection admin interface. The design leverages the existing CLI deployment infrastructure (`deploy.ts`, `GitHelper`, `DeploymentConfigLoader`) and exposes it through a new API endpoint. The UI will include a deploy button in the header that triggers deployment and displays real-time progress feedback.

## Architecture

### High-Level Flow

```
User clicks Deploy Button
  ↓
Frontend sends POST /api/deploy
  ↓
Backend validates Git setup
  ↓
Backend runs deployment (build + push)
  ↓
Backend streams progress to frontend
  ↓
Frontend displays status updates
  ↓
Deployment completes → Show success/error
```

### Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                      Admin UI (React)                        │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────┐ │
│  │ Deploy Button│  │ Deploy Dialog  │  │ Toast Messages  │ │
│  └──────────────┘  └────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP POST /api/deploy
                              │ HTTP GET /api/deploy/status
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Admin Server (Express)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  New Endpoints:                                       │  │
│  │  • POST /api/deploy - Trigger deployment             │  │
│  │  • GET /api/deploy/status - Check Git configuration  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Uses existing modules
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Existing Deployment Infrastructure              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  GitHelper   │  │ Deployment   │  │  deploy()        │ │
│  │              │  │ ConfigLoader │  │  function        │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Frontend Components

#### DeployButton Component

**Location:** `src/admin/client/src/components/DeployButton.tsx`

**Purpose:** Button in the header that triggers deployment

**Props:**
```typescript
interface DeployButtonProps {
  disabled?: boolean;
  onDeployStart?: () => void;
  onDeployComplete?: (success: boolean) => void;
}
```

**State:**
```typescript
interface DeployButtonState {
  isDeploying: boolean;
  deployStatus: DeploymentStatus | null;
  gitStatus: GitStatus | null;
}
```

**Behavior:**
- Fetches Git status on mount to determine if button should be enabled
- Shows tooltip when disabled explaining why
- Opens confirmation dialog when clicked
- Displays deployment progress during deployment
- Shows success/error toast when complete

#### DeployDialog Component

**Location:** `src/admin/client/src/components/DeployDialog.tsx`

**Purpose:** Confirmation dialog showing deployment details before proceeding

**Props:**
```typescript
interface DeployDialogProps {
  isOpen: boolean;
  deployConfig: DeploymentInfo;
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Content:**
- Repository URL
- Target branch
- Base URL
- Custom domain (if configured)
- Warning about public deployment

#### DeployProgress Component

**Location:** `src/admin/client/src/components/DeployProgress.tsx`

**Purpose:** Modal showing real-time deployment progress

**Props:**
```typescript
interface DeployProgressProps {
  isOpen: boolean;
  status: DeploymentStatus;
  onClose?: () => void;
}
```

**Content:**
- Current step indicator (Validating → Building → Deploying)
- Progress messages
- Elapsed time
- Cancel button (disabled during critical steps)

### 2. Backend API Endpoints

#### GET /api/deploy/status

**Purpose:** Check Git configuration and deployment readiness

**Response:**
```typescript
interface DeployStatusResponse {
  ready: boolean;
  gitInstalled: boolean;
  isGitRepo: boolean;
  hasRemote: boolean;
  remoteName: string;
  remoteUrl: string;
  currentBranch: string;
  deployConfig?: {
    branch: string;
    baseUrl: string;
    homepage: string | null;
    buildDir: string;
  };
  issues?: string[]; // List of problems preventing deployment
}
```

**Error Responses:**
- 500: Server error checking Git status

#### POST /api/deploy

**Purpose:** Trigger GitHub Pages deployment

**Request Body:**
```typescript
interface DeployRequest {
  force?: boolean; // Force push (optional)
  message?: string; // Custom commit message (optional)
}
```

**Response:**
```typescript
interface DeployResponse {
  success: boolean;
  message: string;
  url?: string; // GitHub Pages URL
  branch?: string;
  duration?: number; // Deployment time in ms
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Status Codes:**
- 200: Deployment successful
- 400: Invalid request or validation failed
- 500: Deployment failed

**Behavior:**
- Validates Git setup
- Runs build (using existing Generator)
- Pushes to gh-pages branch (using gh-pages package)
- Returns deployment result

### 3. Backend Service Layer

#### DeploymentService

**Location:** `src/admin/server/deployment-service.ts`

**Purpose:** Encapsulate deployment logic for use by API endpoints

**Methods:**

```typescript
class DeploymentService {
  /**
   * Check if deployment is possible and get configuration
   */
  static async getDeploymentStatus(cwd: string): Promise<DeployStatusResponse>;

  /**
   * Execute deployment
   */
  static async deploy(
    cwd: string,
    options: DeployRequest
  ): Promise<DeployResponse>;

  /**
   * Get deployment configuration without deploying
   */
  static async getDeploymentConfig(cwd: string): Promise<DeploymentConfig>;
}
```

**Implementation Notes:**
- Reuses existing `GitHelper.validateRepository()`
- Reuses existing `DeploymentConfigLoader.load()`
- Calls existing `deploy()` function from `src/cli/deploy.ts`
- Wraps CLI deployment for API use (captures output, handles errors)

## Data Models

### DeploymentStatus

```typescript
interface DeploymentStatus {
  step: 'validating' | 'building' | 'deploying' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
  startTime: number;
  endTime?: number;
  error?: {
    message: string;
    details?: string;
    solution?: string;
  };
}
```

### GitStatus

```typescript
interface GitStatus {
  installed: boolean;
  isRepo: boolean;
  hasRemote: boolean;
  remoteName: string;
  remoteUrl: string;
  branch: string;
}
```

### DeploymentInfo

```typescript
interface DeploymentInfo {
  repositoryUrl: string;
  branch: string;
  baseUrl: string;
  homepage: string | null;
  buildDir: string;
}
```

## Error Handling

### Error Categories

1. **Git Not Installed**
   - Disable button
   - Tooltip: "Git is not installed"
   - Solution link: Git installation guide

2. **Not a Git Repository**
   - Disable button
   - Tooltip: "Not a Git repository"
   - Solution: "Run 'git init' to initialize"

3. **No Remote Configured**
   - Disable button
   - Tooltip: "No Git remote configured"
   - Solution: "Run 'git remote add origin <url>'"

4. **Build Failure**
   - Show error dialog with build errors
   - Provide "View Details" button
   - Suggest fixing validation errors

5. **Authentication Failure**
   - Show error dialog with auth instructions
   - Provide links to SSH key setup
   - Suggest using personal access token

6. **Push Rejected**
   - Show error dialog with conflict details
   - Offer "Force Push" option (with warning)
   - Suggest manual conflict resolution

### Error Display

All errors will be displayed using:
- Toast notifications for quick feedback
- Error dialogs for detailed information
- Inline help text with solutions
- Links to documentation

## Testing Strategy

### Unit Tests

**Frontend:**
- `DeployButton.test.tsx` - Button rendering, state management, click handling
- `DeployDialog.test.tsx` - Dialog display, confirmation/cancellation
- `DeployProgress.test.tsx` - Progress display, step transitions

**Backend:**
- `deployment-service.test.ts` - Service methods, error handling
- `admin-server.test.ts` - API endpoint responses, status codes

### Integration Tests

**API Integration:**
- `tests/integration/admin-deploy.test.ts`
  - Test GET /api/deploy/status with various Git configurations
  - Test POST /api/deploy success flow
  - Test POST /api/deploy error scenarios
  - Test deployment with custom options

**End-to-End:**
- Test full deployment flow from UI button click to completion
- Test error handling and recovery
- Test deployment with different repository configurations

### Manual Testing Scenarios

1. **Happy Path:**
   - Click deploy button
   - Confirm deployment
   - Watch progress
   - Verify success message
   - Check GitHub Pages URL

2. **Git Not Configured:**
   - Start without Git installed
   - Verify button is disabled
   - Verify tooltip shows reason

3. **Build Failure:**
   - Create invalid project data
   - Attempt deployment
   - Verify error message
   - Fix data and retry

4. **Authentication Failure:**
   - Use repository without push access
   - Attempt deployment
   - Verify error message with solutions

5. **Force Push:**
   - Create conflict scenario
   - Attempt normal deployment (fails)
   - Use force push option
   - Verify success

## UI/UX Considerations

### Button Placement

The deploy button will be positioned in the header to the left of "New Project":

```
┌─────────────────────────────────────────────────────────┐
│  Projection Admin                                        │
│                                                          │
│  [🚀 Deploy to GitHub Pages]  [+ New Project]          │
└─────────────────────────────────────────────────────────┘
```

### Visual States

**Enabled:**
- Primary button style (blue/green)
- Rocket icon (🚀)
- Hover effect

**Disabled:**
- Grayed out
- Cursor: not-allowed
- Tooltip on hover

**Deploying:**
- Loading spinner
- Text: "Deploying..."
- Disabled (can't click again)

### Progress Feedback

**Deployment Steps:**
1. ✓ Validating Git setup
2. ⏳ Building site...
3. ⏳ Deploying to GitHub Pages...
4. ✓ Deployment complete!

**Progress Bar:**
- 0-25%: Validation
- 25-75%: Building
- 75-100%: Deploying

### Success State

**Toast Message:**
"🎉 Deployed successfully! Your site is live at [URL]"

**Dialog:**
- Success icon
- GitHub Pages URL (clickable)
- "View Site" button
- "Close" button

### Error State

**Toast Message:**
"❌ Deployment failed. Click for details."

**Error Dialog:**
- Error icon
- Error message
- Detailed explanation
- Solution steps
- "Try Again" button
- "View Logs" button (if available)

## Security Considerations

1. **Authentication:**
   - Deployment uses Git credentials from the system
   - No credentials stored in admin server
   - Relies on user's existing Git authentication

2. **Authorization:**
   - Admin server only accessible locally (localhost)
   - No remote access to deployment endpoint
   - User must have push access to repository

3. **Input Validation:**
   - Validate custom commit messages
   - Sanitize error messages before display
   - Prevent command injection in Git operations

4. **Error Messages:**
   - Don't expose sensitive system information
   - Sanitize file paths in error messages
   - Provide helpful but not overly detailed errors

## Performance Considerations

1. **Async Operations:**
   - Deployment runs asynchronously
   - UI remains responsive during deployment
   - Progress updates don't block UI

2. **Build Optimization:**
   - Reuse existing build infrastructure
   - Clean build directory before building
   - Stream build output for progress updates

3. **Timeout Handling:**
   - Set reasonable timeout for deployment (5 minutes)
   - Show timeout error with retry option
   - Allow cancellation during long operations

## Accessibility

1. **Keyboard Navigation:**
   - Deploy button accessible via Tab
   - Enter/Space to activate
   - Escape to close dialogs

2. **Screen Readers:**
   - Proper ARIA labels on button
   - Announce deployment status changes
   - Describe progress steps

3. **Visual Indicators:**
   - Color not the only indicator
   - Icons + text for status
   - High contrast for disabled state

## Future Enhancements

1. **Deployment History:**
   - Track past deployments
   - Show deployment log
   - Rollback capability

2. **Preview Deployment:**
   - Deploy to preview branch
   - Test before production
   - Preview URL generation

3. **Deployment Settings:**
   - Configure branch in UI
   - Set custom domain
   - Manage deployment options

4. **Notifications:**
   - Email on deployment complete
   - Slack/Discord webhooks
   - Desktop notifications

5. **Multi-Environment:**
   - Deploy to staging
   - Deploy to production
   - Environment-specific configs

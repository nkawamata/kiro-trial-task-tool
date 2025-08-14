# Task Assignment and Workload Integration - Usage Guide

## Overview

The task assignment and workload integration creates a seamless connection between assigning tasks to team members and managing their workload capacity. This integration helps project managers make informed assignment decisions and prevents team member overallocation.

## Key Components

### Backend Integration

#### 1. TaskWorkloadIntegrationService
**Location**: `backend/src/services/taskWorkloadIntegrationService.ts`

**Key Methods**:
- `assignTaskWithWorkload()` - Assigns task with automatic workload creation
- `getAssignmentSuggestions()` - Returns optimal assignee recommendations
- `getWorkloadImpact()` - Calculates workload impact of assignment
- `getUserCapacityInfo()` - Gets user capacity information

#### 2. Enhanced API Endpoints
**New Routes** (added to `/api/tasks`):
- `POST /:id/assign-with-workload` - Assign task with workload allocation
- `GET /:id/assignment-suggestions` - Get assignment suggestions
- `GET /:id/workload-impact/:assigneeId` - Get workload impact preview
- `GET /capacity/:userId` - Get user capacity information

### Frontend Integration

#### 1. WorkloadAwareAssigneeSelector
**Location**: `frontend/src/components/tasks/WorkloadAwareAssigneeSelector.tsx`

**Features**:
- Shows assignee capacity indicators
- Displays assignment suggestions with scores
- Real-time workload impact preview
- Visual capacity warnings

#### 2. WorkloadImpactPreview
**Location**: `frontend/src/components/workload/WorkloadImpactPreview.tsx`

**Features**:
- Shows current vs new workload
- Capacity utilization visualization
- Over-allocation warnings
- Affected timeline display

#### 3. CapacityIndicator
**Location**: `frontend/src/components/workload/CapacityIndicator.tsx`

**Features**:
- Visual capacity representation
- Utilization percentage
- Status indicators (Available/Busy/Overloaded)
- Compact and detailed variants

#### 4. Integration Hook
**Location**: `frontend/src/hooks/useTaskWorkloadIntegration.ts`

**Features**:
- Centralized integration logic
- Automatic data loading
- Assignment validation
- Team capacity overview

## Usage Examples

### 1. Basic Task Assignment with Workload

```typescript
import { useTaskWorkloadIntegration } from '../hooks/useTaskWorkloadIntegration';

const MyComponent = ({ taskId }) => {
  const {
    assignTaskWithWorkload,
    suggestions,
    loading
  } = useTaskWorkloadIntegration({ taskId });

  const handleAssign = async (assigneeId: string) => {
    try {
      const result = await assignTaskWithWorkload(assigneeId, {
        distributionStrategy: WorkloadDistributionStrategy.EVEN,
        autoAllocate: true
      });
      console.log('Assignment successful:', result);
    } catch (error) {
      console.error('Assignment failed:', error);
    }
  };

  return (
    <div>
      {suggestions.map(suggestion => (
        <button
          key={suggestion.userId}
          onClick={() => handleAssign(suggestion.userId)}
          disabled={loading}
        >
          {suggestion.userName} (Score: {suggestion.recommendationScore})
        </button>
      ))}
    </div>
  );
};
```

### 2. Workload-Aware Assignment Form

```typescript
import { WorkloadAwareAssigneeSelector } from '../components/tasks/WorkloadAwareAssigneeSelector';

const TaskAssignmentForm = ({ taskId, projectMembers }) => {
  const [assigneeId, setAssigneeId] = useState('');

  return (
    <form>
      <WorkloadAwareAssigneeSelector
        value={assigneeId}
        onChange={setAssigneeId}
        projectMembers={projectMembers}
        taskId={taskId}
        showSuggestions={true}
        showWorkloadImpact={true}
      />
    </form>
  );
};
```

### 3. Capacity Monitoring

```typescript
import { CapacityIndicator } from '../components/workload/CapacityIndicator';

const TeamCapacityView = ({ teamMembers }) => {
  return (
    <div>
      {teamMembers.map(member => (
        <CapacityIndicator
          key={member.userId}
          userId={member.userId}
          userName={member.userName}
          showDetails={true}
          size="medium"
        />
      ))}
    </div>
  );
};
```

### 4. Assignment Validation

```typescript
const validateBeforeAssignment = async (taskId: string, assigneeId: string) => {
  const validation = await taskWorkloadService.validateAssignment(taskId, assigneeId);
  
  if (!validation.isValid) {
    console.error('Assignment validation failed:', validation.errors);
    return false;
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Assignment warnings:', validation.warnings);
    // Show warnings to user but allow assignment
  }
  
  return true;
};
```

## Configuration Options

### Workload Distribution Strategies

```typescript
enum WorkloadDistributionStrategy {
  EVEN = 'even',           // Distribute hours evenly across timeline
  FRONT_LOADED = 'front_loaded', // More hours at the beginning
  BACK_LOADED = 'back_loaded',   // More hours toward the end
  CUSTOM = 'custom'        // Custom distribution pattern
}
```

### Capacity Settings

Default settings can be customized:
- **Standard weekly capacity**: 40 hours (configurable per user)
- **Over-allocation threshold**: 110% of capacity
- **Capacity warning threshold**: 80% of capacity

## Integration Workflow

### 1. Task Creation with Assignment
1. User creates task with estimated hours and timeline
2. System shows assignment suggestions based on team capacity
3. User selects assignee with workload impact preview
4. System creates task and automatically allocates workload

### 2. Task Assignment Update
1. User selects existing task to reassign
2. System shows current assignee workload impact
3. User sees suggestions for better assignments
4. System updates assignment and adjusts workload entries

### 3. Capacity Planning
1. Project manager views team capacity dashboard
2. System shows utilization rates and availability
3. Manager identifies over/under-allocated members
4. System suggests workload redistribution

## Best Practices

### 1. Assignment Decision Making
- Always check assignment suggestions before manual selection
- Review workload impact before confirming assignment
- Consider team member skills alongside capacity
- Use validation to catch potential issues early

### 2. Workload Management
- Set realistic estimated hours for accurate capacity planning
- Use appropriate distribution strategies for different task types
- Monitor team capacity regularly to prevent burnout
- Adjust assignments based on actual vs estimated hours

### 3. Team Coordination
- Communicate workload changes to affected team members
- Use capacity indicators to identify bottlenecks early
- Balance workload across team members for optimal productivity
- Consider individual preferences and working styles

## Troubleshooting

### Common Issues

#### 1. Assignment Suggestions Not Loading
- Check if task has estimated hours and timeline
- Verify project members are properly configured
- Ensure backend integration service is running

#### 2. Workload Impact Not Calculating
- Confirm task has valid start/end dates
- Check if assignee exists in the system
- Verify workload service is accessible

#### 3. Capacity Indicators Showing Incorrect Data
- Refresh capacity data if stale
- Check date range parameters
- Verify user permissions for capacity data

### Debug Commands

```bash
# Check integration service health
curl http://localhost:3001/api/tasks/{taskId}/assignment-suggestions

# Verify workload impact calculation
curl http://localhost:3001/api/tasks/{taskId}/workload-impact/{userId}

# Check user capacity
curl http://localhost:3001/api/tasks/capacity/{userId}?startDate=2024-01-01&endDate=2024-01-31
```

## Performance Considerations

### Backend Optimization
- Cache assignment suggestions for frequently accessed tasks
- Batch capacity calculations for team views
- Use database indexes for efficient workload queries
- Implement rate limiting for capacity endpoints

### Frontend Optimization
- Debounce assignment suggestion requests
- Cache capacity data with appropriate TTL
- Use React.memo for expensive capacity calculations
- Implement virtual scrolling for large team lists

## Future Enhancements

### Planned Features
- AI-powered assignment optimization
- Skill-based assignment matching
- Integration with external calendar systems
- Advanced workload forecasting
- Mobile-optimized capacity views

### Integration Opportunities
- Time tracking system integration
- Project management tool connectors
- HR system integration for capacity planning
- Slack/Teams notifications for assignments

This integration provides a powerful foundation for intelligent task assignment and workload management, helping teams work more efficiently and preventing resource overallocation.
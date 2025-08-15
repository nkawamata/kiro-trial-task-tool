# Workload Allocation "Allocated For" - Current Behavior

## Current Implementation

Based on the workload allocation form analysis, here's how the "Allocated For" feature currently works:

### Workload Allocation Form
The current workload allocation form includes:
- **Project** (dropdown)
- **Task** (dropdown) 
- **Allocated Hours** (number input)
- **Date** (date picker)

**Missing**: User/Assignee selector

### How userId is Determined
```typescript
// In WorkloadAllocationDialog.tsx
await apiClient.post('/workload/allocate', {
  userId: user.id,  // Always the current logged-in user
  projectId: formData.projectId,
  taskId: formData.taskId,
  allocatedHours: formData.allocatedHours,
  date: formData.date.toISOString(),
});
```

**Key Point**: The `userId` field is automatically set to the current logged-in user's ID. Users can only allocate work for themselves.

## "Allocated For" Column Behavior

### What It Shows
- **Current User**: The person who created the workload allocation
- **User Information**: Name and email of the person who allocated work for themselves
- **Consistent Display**: All allocations by the same user show the same person

### Example Scenario
If Sarah Johnson logs in and creates workload allocations:
```
┌────────────┬─────────────────────┬──────────┬─────────┐
│    Date    │   Allocated For     │ Allocated│ Actual  │
├────────────┼─────────────────────┼──────────┼─────────┤
│ Jan 15     │ 👤 Sarah Johnson    │    4h    │   3.5h  │
│ Jan 16     │ 👤 Sarah Johnson    │    4h    │   4h    │
│ Jan 17     │ 👤 Sarah Johnson    │    4h    │   3.5h  │
└────────────┴─────────────────────┴──────────┴─────────┘
```

All entries show Sarah Johnson because she created all the allocations for herself.

## Multi-User Scenarios

### How Multiple Users Appear
Different users would appear in "Allocated For" only if:

1. **Multiple Users Create Allocations**: Different team members each create their own allocations for the same task
2. **Task Assignment Integration**: Using advanced features that automatically create allocations for assigned users

### Example with Multiple Users
```
Task: "Implement Authentication"

Mike Chen creates allocation for himself:
│ Jan 15 │ 👤 Mike Chen │ 2h │ 2h │

Sarah Johnson creates allocation for herself:  
│ Jan 16 │ 👤 Sarah Johnson │ 4h │ 3.5h │

Alex Rodriguez creates allocation for himself:
│ Jan 17 │ 👤 Alex Rodriguez │ 3h │ 3h │
```

## Current Limitations

### No Manager Allocation
- **Cannot Allocate for Others**: Managers cannot allocate work for team members
- **Self-Service Only**: Each user must create their own allocations
- **No Delegation**: No way to assign work to specific people through the allocation form

### Workarounds
1. **Task Assignment**: Assign tasks to users (separate from workload allocation)
2. **Manual Coordination**: Team members create their own allocations based on discussions
3. **Advanced Integration**: Use task-workload integration features for automatic allocation

## Future Enhancements

### Proposed Improvements
1. **User Selector in Form**: Add ability to select who work is allocated for
2. **Manager Permissions**: Allow project managers to allocate work for team members
3. **Bulk Allocation**: Allocate work for multiple users at once
4. **Role-Based Access**: Different allocation permissions based on user roles

### Enhanced Form Design
```
Allocate Workload
┌─────────────────────────────────────────┐
│ Project: [Dropdown]                     │
│ Task: [Dropdown]                        │
│ Allocated For: [User Selector] ← NEW    │
│ Allocated Hours: [Number]               │
│ Date: [Date Picker]                     │
└─────────────────────────────────────────┘
```

## Technical Implementation Notes

### Current Data Flow
1. User opens workload allocation form
2. User selects project, task, hours, and date
3. System automatically uses `user.id` for `userId` field
4. Allocation is created for the current user
5. "Allocated For" column shows the current user's information

### Database Structure
```typescript
interface WorkloadEntry {
  id: string;
  userId: string;        // Who the work is allocated for
  projectId: string;
  taskId: string;
  date: Date;
  allocatedHours: number;
  actualHours?: number;
}
```

The `userId` field determines who appears in the "Allocated For" column.

## Conclusion

The current "Allocated For" feature correctly shows who work is allocated for based on the `userId` field in workload entries. However, the current allocation form only allows self-allocation, so users typically see their own information in this column.

For more diverse allocation scenarios, the system would need enhancements to allow managers or team leads to allocate work for other team members.
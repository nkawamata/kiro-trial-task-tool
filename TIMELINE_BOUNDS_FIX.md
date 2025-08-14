# Timeline Bounds Fix - Addressing Persistent Date Alignment

## Problem
Despite previous fixes, the date alignment issue persists:
- Task "bbbbbbbb" shows dates 2025/8/11 - 2025/8/18
- Task still appears around day 9-10 instead of day 11
- There's still a 1-2 day offset in the timeline

## Root Cause Analysis
The issue was in the timeline bounds calculation. The previous approach:
```typescript
// OLD - Problematic approach
start: new Date(startYear - 1, 0, 1), // January 1st of previous year
end: new Date(endYear + 1, 11, 31)    // December 31st of next year
```

This created a timeline that started from an arbitrary January 1st, which didn't align well with the actual task dates and could cause subtle positioning errors.

## New Solution - Month-Aligned Timeline Bounds

### Improved Timeline Bounds Calculation
```typescript
// NEW - Month-aligned approach
const taskDates = tasks.flatMap(t => [t.start, t.end]);
const minDate = new Date(Math.min(...taskDates.map(d => d.getTime())));
const maxDate = new Date(Math.max(...taskDates.map(d => d.getTime())));

// Start from beginning of month 6 months before earliest task
const startMonth = new Date(minDate.getFullYear(), minDate.getMonth() - 6, 1);
// End at end of month 6 months after latest task  
const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth() + 7, 0);

return {
  start: normalizeDateString(startMonth),
  end: normalizeDateString(endMonth)
};
```

## Key Improvements

### 1. Task-Relative Timeline
- Timeline bounds are now calculated relative to actual task dates
- No more arbitrary January 1st starting point
- More predictable and logical timeline range

### 2. Month-Aligned Boundaries
- Timeline starts at the beginning of a month
- Timeline ends at the end of a month
- Better alignment with month-based navigation

### 3. Consistent Date Handling
- All dates are normalized immediately when bounds are calculated
- Eliminates timing differences in normalization
- Ensures consistent reference points

### 4. Reasonable Padding
- 6 months before earliest task for context
- 6 months after latest task for planning
- Sufficient range without excessive overhead

## Expected Results

### Timeline Alignment
- Tasks should now appear exactly under their corresponding dates
- Task starting 2025/8/11 should appear under day 11
- No more offset issues

### Navigation Consistency
- Month navigation should work smoothly
- Timeline bounds align with navigation expectations
- Scrolling maintains accurate positioning

### Performance Benefits
- Smaller timeline range (months vs years)
- More efficient calculations
- Better memory usage

## Technical Details

### Files Modified
- `frontend/src/components/gantt/GanttTimeline.tsx`

### Calculation Method
1. Find actual min/max dates from all tasks
2. Create month-aligned bounds with 6-month padding
3. Normalize all dates consistently
4. Use same bounds for both timeline scale and task positioning

## Verification Steps
1. Check that task "bbbbbbbb" (2025/8/11) appears under day 11
2. Verify other tasks align with their dates
3. Test month navigation accuracy
4. Confirm today line appears at correct position

## Fallback Plan
If this fix doesn't resolve the alignment issue, the next step would be to:
1. Add temporary debug logging to compare exact positions
2. Verify date parsing in GanttChartView component
3. Check for timezone-related issues in date handling
4. Consider simplifying the positioning calculation further

This fix addresses the timeline bounds calculation, which is the most likely source of the persistent alignment issue.
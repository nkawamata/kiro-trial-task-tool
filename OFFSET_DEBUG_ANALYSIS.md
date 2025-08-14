# Date Offset Debug Analysis

## Problem
- Task "bbbbbbbb" shows start date: 2025/8/11
- Task appears at timeline position: day 9
- Expected position: day 11
- **Offset: 2 days early**

## Potential Causes

### 1. Timeline Scale Generation Issue
The timeline scale might be generating dates that are offset from the actual calendar dates.

### 2. Task Position Calculation Issue
The task positioning calculation might be using a different reference point than the timeline scale.

### 3. Date Normalization Issue
The `normalizeDateString` function might be causing subtle timezone or date boundary issues.

### 4. Timeline Bounds Issue
The timeline bounds calculation might be creating an offset in the reference dates.

## Investigation Steps

### Step 1: Verify Timeline Scale Dates
Check if the timeline scale is generating the correct dates for each position.

### Step 2: Verify Task Position Calculation
Check if the task position calculation is using the same reference dates as the timeline scale.

### Step 3: Check Date Parsing
Verify that task dates are being parsed correctly from the source data.

## Current Hypothesis
The most likely issue is that the timeline scale generation and task positioning are using slightly different date calculation methods or reference points, causing a consistent 2-day offset.

## Next Steps
1. Ensure both timeline scale and task positioning use identical date normalization
2. Verify that timeline bounds are calculated consistently
3. Check for any timezone-related date parsing issues
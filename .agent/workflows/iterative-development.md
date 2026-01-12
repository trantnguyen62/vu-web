---
description: How to use iterative development workflow (Ralph Wiggum style)
---

# Iterative Development Workflow

This workflow enables autonomous, iterative development where the AI keeps working until a task is complete. Inspired by the "Ralph Wiggum" technique - persistence beats perfection.

## How to Use

### 1. Define Your Task with Rounds and Success Criteria

Tell me what you want done, how many rounds of iteration, and success criteria:

```
Task: [Describe what you want built/fixed/improved]

Rounds: [Number] (e.g., 3, 5, 10)

Success Criteria:
- [ ] Criterion 1 (e.g., "All tests pass")
- [ ] Criterion 2 (e.g., "No console errors")
- [ ] Criterion 3 (e.g., "Feature X works as expected")
```

**Each round I will:**
1. Review current state
2. Make improvements
3. Verify changes
4. Report progress (Round X of Y complete)
5. Continue to next round OR stop if all criteria met early

### 2. Example Prompts

**For Bug Fixes:**
```
Task: Fix the loan calculator not updating totals.
Rounds: 3
Success: Calculator updates on input change, no console errors.
```

**For New Features:**
```
Task: Add dark mode toggle to all pages.
Rounds: 5
Success: Toggle works, persists across pages, no visual bugs.
```

**For Refactoring:**
```
Task: Refactor styles.css to use CSS variables for colors.
Rounds: 4
Success: All colors use variables, site looks identical.
```

**For Polish/Improvements:**
```
Task: Improve the UI/UX of the loan calculator page.
Rounds: 10
Success: Modern look, smooth animations, great user experience.
```

### 3. Verification Commands

// turbo-all
```bash
# Start dev server to test changes
python3 -m http.server 8080

# Check for JavaScript errors
npx eslint *.js --no-error-on-unmatched-pattern

# Validate HTML
npx html-validate *.html
```

## Tips for Best Results

1. **Be Specific** - Vague tasks lead to vague results
2. **Testable Criteria** - "It works" is bad; "clicking X does Y" is good
3. **One Thing at a Time** - Complex tasks should be broken into steps
4. **Approve Quickly** - The faster you approve, the faster iteration happens

## When to Stop Iterating

The iteration ends when:
- All success criteria are met ✅
- You say "stop" or "that's good enough"
- A blocking issue requires your decision

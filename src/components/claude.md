# Components Directory

This directory will contain all reusable React components.

## Component Structure (Planned)

### Layout Components
- **Header** - Navigation bar with user menu
- **Footer** - Site footer with links
- **Sidebar** - League navigation sidebar

### Feature Components
- **LeagueCard** - Display league summary
- **TeamPicker** - NFL team selection interface
- **WeekSelector** - Navigate between NFL weeks
- **PickHistory** - Show user's previous picks
- **Standings** - League standings table

### UI Components
- **Button** - Consistent button styling
- **Card** - Content container component
- **Modal** - Overlay dialog component
- **Loading** - Loading states
- **ErrorBoundary** - Error handling wrapper

## Component Guidelines

### Naming Conventions
- PascalCase for component names
- Descriptive names that indicate purpose
- Suffix with component type when ambiguous

### File Structure
```
ComponentName/
├── index.tsx        # Component implementation
├── ComponentName.test.tsx  # Tests
└── README.md        # Component documentation
```

### Props Best Practices
- Define interfaces for all props
- Use descriptive prop names
- Provide default values when sensible
- Document complex props

### Styling Approach
- Use Tailwind classes exclusively
- Create consistent variants (primary, secondary, etc.)
- Support responsive design
- Allow className override for flexibility

### State Management
- Prefer server state from Supabase
- Use local state for UI-only concerns
- Lift state up when shared between components
- Consider React Context for cross-component state

## Example Component Pattern
```typescript
interface ComponentProps {
  variant?: 'primary' | 'secondary'
  className?: string
  children: React.ReactNode
}

export function Component({ 
  variant = 'primary',
  className = '',
  children 
}: ComponentProps) {
  return (
    <div className={`base-styles ${variant} ${className}`}>
      {children}
    </div>
  )
}
```
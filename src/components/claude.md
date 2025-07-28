# Components Directory

Currently empty but designed for reusable React components. Components are currently embedded directly in pages due to rapid development phase.

## Current Implementation Status

### Inline Components ✅
Components are currently defined within page files for rapid iteration:
- **League forms** - Create/join league forms embedded in page components
- **Navigation** - Header navigation implemented directly in layout files
- **Loading states** - Inline loading spinners and skeleton states
- **Error displays** - Error messaging embedded in form components

### Styling Patterns Used ✅
- **Tailwind CSS** - All styling uses Tailwind utility classes
- **Responsive design** - Mobile-first responsive layouts
- **Primary color scheme** - Consistent `primary-*` color classes
- **Card layouts** - White backgrounds with shadows for content areas
- **Form styling** - Consistent input and button styling patterns

## Planned Component Extraction 🔄

### Layout Components
- **Header** - Extract navigation bar with user menu from layout.tsx
- **Footer** - Site footer with links and branding
- **Sidebar** - League navigation sidebar for league-specific pages
- **Navigation** - Breadcrumb navigation for deep pages

### Feature Components
- **LeagueCard** - Extract league display from dashboard
- **MemberList** - Extract member listing from league overview
- **PickDisplay** - Extract pick history display
- **InviteButton** - Extract invitation creation interface
- **TeamPicker** - NFL team selection interface (future)
- **WeekSelector** - Navigate between NFL weeks (future)
- **Standings** - League standings table (future)

### UI Components
- **Button** - Extract consistent button styling with variants
- **Card** - Content container component with consistent styling
- **Modal** - Overlay dialog component for forms and confirmations
- **Loading** - Centralized loading state components
- **ErrorBoundary** - Error handling wrapper for graceful failures
- **FormField** - Reusable form input with label and error handling

### Auth Components
- **SignInForm** - Extract authentication form from signin page
- **ProtectedRoute** - Higher-order component for route protection
- **SessionWrapper** - Component wrapper for session-dependent content

## Current Patterns in Pages ✅

### Form Components Pattern
```typescript
// Currently in pages, should be extracted
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')
  // API call logic
}

return (
  <form onSubmit={handleSubmit} className="space-y-4">
    {error && (
      <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )}
    {/* Form fields */}
  </form>
)
```

### Loading State Pattern
```typescript
// Currently inline, should be component
if (status === 'loading') {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  )
}
```

### Navigation Pattern
```typescript
// In multiple pages, should be extracted
<nav className="bg-white shadow-sm border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      <div className="flex items-center">
        <Link href="/dashboard">← Dashboard</Link>
        <h1 className="text-xl font-bold">{pageTitle}</h1>
      </div>
    </div>
  </div>
</nav>
```

## Component Architecture Guidelines

### File Structure (When Implemented)
```
components/
├── ui/              # Basic UI components
│   ├── Button/
│   ├── Card/
│   └── Modal/
├── forms/           # Form-specific components
│   ├── SignInForm/
│   └── LeagueForm/
├── layout/          # Layout components
│   ├── Header/
│   └── Navigation/
└── features/        # Feature-specific components
    ├── LeagueCard/
    └── MemberList/
```

### Props Interface Pattern
```typescript
interface ComponentProps {
  // Required props first
  title: string
  onSubmit: (data: FormData) => void
  
  // Optional props with defaults
  variant?: 'primary' | 'secondary'
  loading?: boolean
  className?: string
  
  // Children when appropriate
  children?: React.ReactNode
}
```

### Styling Consistency
- **Base classes** - Define consistent base styling
- **Variant support** - Primary, secondary, danger color schemes
- **Size variations** - Small, medium, large sizing options
- **State styling** - Loading, disabled, error states
- **Responsive behavior** - Mobile-first responsive design

### State Management Patterns
- **Server state** - Use React Query/SWR for API data (future)
- **Form state** - Use React Hook Form for complex forms (future)
- **UI state** - Local useState for component-specific state
- **Global state** - React Context for cross-component needs

## Refactoring Priority 🔄

### High Priority (Next Sprint)
1. **Button component** - Most commonly used, high impact
2. **Loading component** - Used across multiple pages
3. **Card component** - Consistent container styling
4. **FormField component** - Reduce form code duplication

### Medium Priority
1. **Header/Navigation** - Extract from layout for reusability
2. **LeagueCard** - Clean up dashboard display
3. **Error display** - Consistent error messaging

### Low Priority
1. **Modal component** - Currently no modal usage
2. **Advanced form components** - After basic refactoring
3. **Animation components** - Polish after core functionality

## Testing Strategy (Future)
- **Unit tests** - Test component logic and rendering
- **Integration tests** - Test component interactions
- **Accessibility tests** - Ensure WCAG compliance
- **Visual regression tests** - Prevent styling breaks
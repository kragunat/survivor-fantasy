# Bulma CSS Migration

## Overview
Successfully migrated from Tailwind CSS to Bulma CSS framework to achieve styling similar to popular fantasy sports apps like Sleeper.

## Implementation Details

### Package Installation
```bash
npm install bulma
```

### Global CSS Configuration
Updated `/src/app/globals.css`:
```css
@import 'bulma/css/bulma.css';

/* Custom styles */
html, body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Custom Bulma overrides */
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.navbar {
  box-shadow: 0 2px 4px rgba(10, 10, 10, 0.1);
}
```

## Updated Pages

### Landing Page (`/`)
- **Before**: Complex two-button layout with Tailwind styling
- **After**: Clean hero section with single "Get Started" button
- **Styling**: Uses Bulma hero, title, subtitle, and button classes
- **Design**: Purple gradient background with centered content

### League Overview Page (`/leagues/[id]`)
- **Navigation**: Clean navbar with brand and menu sections
- **Layout**: Bulma columns system for responsive two-column layout
- **Components**: 
  - Boxes for content sections
  - Levels for horizontal alignment
  - Notifications for member/pick cards
  - Modal for confirmation dialogs
- **Interactive Elements**: Loading states, buttons, tags

### Sign In/Sign Up Page (`/auth/signin`)
- **Layout**: Centered form using Bulma hero and columns
- **Form Elements**: Bulma field, control, input, and label classes
- **Notifications**: Info and danger notifications for user feedback
- **Buttons**: Primary and text button styling
- **Google OAuth**: Clean button with icon and text

## Key Bulma Components Used

### Layout
- `hero`: Full-height sections for landing and auth pages
- `section`: Content sections with proper spacing
- `container`: Responsive content containers
- `columns`/`column`: Flexible grid system
- `level`: Horizontal alignment utility

### Elements
- `box`: Content containers with shadow and padding
- `button`: Various button styles (primary, danger, text, loading)
- `notification`: Alert-style messages
- `tag`: Small labels for status indicators
- `modal`: Overlay dialogs

### Form Components
- `field`: Form field containers
- `control`: Input control wrappers
- `input`: Styled form inputs
- `label`: Form labels

### Typography
- `title`/`subtitle`: Hierarchical headings
- Text helpers: `has-text-centered`, `has-text-grey`, etc.
- Weight helpers: `has-text-weight-semibold`

## Design Benefits

### Consistency
- Unified design language across all pages
- Consistent spacing and typography
- Professional appearance similar to modern fantasy apps

### Responsiveness
- Mobile-first responsive design
- Flexible grid system
- Proper touch targets for mobile devices

### User Experience
- Clear visual hierarchy
- Intuitive interactive elements
- Loading states and feedback
- Accessibility considerations built-in

## File Size Impact
- Bundle size remains similar to Tailwind
- Bulma CSS adds ~200KB but provides comprehensive styling
- No significant performance impact on load times

## Future Considerations

### Customization
- Custom CSS variables for brand colors
- Extended theme with team colors
- Dark mode support

### Components
- Consistent styling for future pick submission forms
- League standings tables
- Game result displays
- Notification systems

## Migration Benefits
1. **Faster Development**: Pre-built components reduce custom CSS
2. **Consistency**: Unified design system across the app
3. **Familiarity**: Similar to popular fantasy sports platforms
4. **Maintenance**: Less custom CSS to maintain
5. **Responsiveness**: Built-in mobile optimization
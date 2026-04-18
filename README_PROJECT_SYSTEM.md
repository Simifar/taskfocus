# TaskFocus Enhanced Project System

## Overview

TaskFocus now includes a comprehensive project management system inspired by the best features of Todoist, Trello, and Asana. This enhancement provides hierarchical projects, advanced organization, and powerful management capabilities.

## Quick Start

### 1. Database Migration

```bash
# Run the database migration
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 2. Start the Development Server

```bash
npm run dev
# or
bun dev
```

### 3. Access the New Features

- **Enhanced Sidebar**: Navigate projects with hierarchy and favorites
- **Projects Page**: Full project management at `/projects`
- **Quick Actions**: Inline project creation and management

## New Features

### Hierarchical Projects
- Create parent-child project relationships
- Organize projects in tree structure
- Drag & drop reordering

### Rich Project Metadata
- **Colors**: Visual project identification
- **Icons**: Custom project icons
- **Descriptions**: Detailed project information
- **Favorites**: Quick access to important projects
- **Archiving**: Clean up completed projects

### Progress Tracking
- Visual progress bars
- Task statistics (active/completed)
- Real-time updates

### Smart Organization
- Favorites section in sidebar
- Hierarchical navigation
- Quick actions and context menus
- Bulk operations

## Architecture

### Database Changes

The `categories` table has been enhanced with project-specific fields:

```sql
ALTER TABLE categories 
ADD COLUMN description TEXT,
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN parent_id TEXT,
ADD COLUMN position INTEGER DEFAULT 0;
```

### New Components

1. **ProjectManager** (`/src/features/projects/components/project-manager.tsx`)
   - Full project management interface
   - Create/edit dialogs
   - Hierarchical display

2. **ProjectSidebar** (`/src/features/projects/components/project-sidebar.tsx`)
   - Enhanced sidebar navigation
   - Favorites section
   - Quick actions

3. **Project Hooks** (`/src/features/projects/hooks.ts`)
   - Custom React hooks for project operations
   - Optimistic updates
   - Caching with React Query

### API Endpoints

- Enhanced `/api/categories` with stats and filtering
- Specialized endpoints for favorites, archiving, reordering
- Full CRUD operations with proper error handling

## Usage Examples

### Creating a Project

```typescript
import { useCreateProject } from "@/features/projects/hooks";

const { mutate: createProject } = useCreateProject();

const newProject = await createProject({
  name: "Website Redesign",
  description: "Complete website overhaul",
  color: "#3b82f6",
  icon: "globe"
});
```

### Creating Sub-projects

```typescript
const subproject = await createProject({
  name: "Homepage Design",
  parentId: "parent-project-id"
});
```

### Managing Favorites

```typescript
import { useToggleProjectFavorite } from "@/features/projects/hooks";

const { mutate: toggleFavorite } = useToggleProjectFavorite();

await toggleFavorite(projectId);
```

## Integration with Existing System

The project system seamlessly integrates with existing TaskFocus features:

- **Tasks**: All tasks can be assigned to projects
- **Dashboard**: Project-aware filtering and views
- **Energy System**: Project-based energy tracking
- **Calendar**: Project deadlines and scheduling

## Performance Optimizations

- **Database Indexes**: Optimized queries for project listings
- **React Query**: Intelligent caching and background updates
- **Lazy Loading**: Efficient rendering of large project lists
- **Optimistic Updates**: Immediate UI feedback

## Best Practices

### Project Organization
1. Use clear, descriptive names
2. Create logical hierarchies
3. Use colors for visual organization
4. Archive completed projects instead of deleting

### Performance Tips
1. Limit deep nesting (max 3-4 levels)
2. Use favorites for frequently accessed projects
3. Archive old projects to keep the sidebar clean
4. Use project descriptions for context

## Troubleshooting

### Common Issues

1. **Migration Errors**
   ```bash
   # Reset and retry
   npx prisma migrate reset
   npx prisma db push
   ```

2. **Type Errors**
   ```bash
   # Regenerate types
   npx prisma generate
   ```

3. **Missing Project Data**
   - Check if migration completed successfully
   - Verify database connection

### Debug Mode

Enable debug logging in development:

```typescript
// In your component
const { data: projects } = useProjects({ 
  _debug: true 
});
```

## Future Enhancements

### Planned Features
- [ ] Project templates
- [ ] Team collaboration
- [ ] Advanced filtering
- [ ] Project timelines
- [ ] Export/import functionality
- [ ] Project analytics

### API Extensions
- [ ] Webhook support
- [ ] Bulk operations
- [ ] Project search
- [ ] Integration API

## Contributing

When contributing to the project system:

1. **Code Style**: Follow existing patterns
2. **Types**: Update TypeScript definitions
3. **Tests**: Add comprehensive test coverage
4. **Documentation**: Update relevant docs
5. **Performance**: Consider impact on large datasets

## Support

For issues or questions:

1. Check this documentation
2. Review the [Project System Documentation](./docs/PROJECT_SYSTEM.md)
3. Create an issue in the repository
4. Join the development discussion

---

**Note**: This enhancement maintains full backward compatibility with existing TaskFocus functionality. All existing features continue to work as before, with the new project system adding powerful organizational capabilities.

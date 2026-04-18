# Project System Documentation

## Overview

The TaskFocus project system has been enhanced to provide comprehensive project management capabilities inspired by the best features of Todoist, Trello, and Asana.

## Features

### Core Features
- **Hierarchical Projects**: Create parent-child project relationships
- **Rich Metadata**: Description, colors, icons, favorites, archiving
- **Progress Tracking**: Visual progress bars and task statistics
- **Smart Organization**: Favorites section and intelligent sorting
- **Advanced Management**: Bulk operations and drag & drop reordering

### User Interface
- **Enhanced Sidebar**: Project navigation with favorites and hierarchy
- **Project Manager**: Full project management interface
- **Quick Actions**: Inline editing and context menus
- **Visual Indicators**: Progress bars, badges, and status icons

## Architecture

### Database Schema

The `Category` model has been enhanced with project-specific fields:

```prisma
model Category {
  id          String    @id @default(cuid())
  userId      String
  name        String
  color       String?
  icon        String?
  description String?
  isFavorite  Boolean   @default(false)
  isArchived  Boolean   @default(false)
  parentId    String?
  position    Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks       Task[]
  parent      Category? @relation("ProjectHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children    Category[] @relation("ProjectHierarchy")
  
  // Indexes
  @@unique([userId, name])
  @@index([userId])
  @@index([userId, isArchived])
  @@index([parentId])
}
```

### API Endpoints

#### Categories API
- `GET /api/categories` - List projects with optional archived filter
- `POST /api/categories` - Create new project
- `GET /api/categories/[id]` - Get project details with stats
- `PATCH /api/categories/[id]` - Update project
- `DELETE /api/categories/[id]` - Delete project

#### Specialized Endpoints
- `POST /api/categories/[id]/favorite` - Toggle favorite status
- `POST /api/categories/[id]/archive` - Archive project
- `POST /api/categories/[id]/unarchive` - Unarchive project
- `PATCH /api/categories/reorder` - Bulk reorder projects

### Frontend Components

#### ProjectManager
Full project management interface with:
- Create/edit dialogs
- Hierarchical display
- Progress tracking
- Bulk operations

#### ProjectSidebar
Enhanced sidebar navigation with:
- Favorites section
- Hierarchical navigation
- Quick actions
- Task counts

#### React Hooks
- `useProjects()` - Project listing
- `useCreateProject()` - Create projects
- `useUpdateProject()` - Update projects
- `useDeleteProject()` - Delete projects
- `useToggleProjectFavorite()` - Toggle favorites
- `useArchiveProject()` - Archive projects
- `useProjectStats()` - Project statistics

## Installation & Setup

### Database Migration

1. **Run the migration**:
   ```bash
   npx prisma db push
   # or
   npx prisma migrate dev
   ```

2. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

### Manual Migration (if needed)

If automatic migration fails, run the SQL migration manually:

```sql
-- Add project features to categories table
ALTER TABLE categories 
ADD COLUMN description TEXT,
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN parent_id TEXT,
ADD COLUMN position INTEGER DEFAULT 0;

-- Add foreign key constraint
ALTER TABLE categories 
ADD CONSTRAINT categories_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX categories_user_id_is_archived_idx ON categories(user_id, is_archived);
CREATE INDEX categories_parent_id_idx ON categories(parent_id);
```

## Usage

### Creating Projects

```typescript
const newProject = await createProject.mutateAsync({
  name: "My Project",
  description: "Project description",
  color: "#3b82f6",
  icon: "folder",
  parentId: "parent-project-id" // optional
});
```

### Managing Project Hierarchy

```typescript
// Create subproject
const subproject = await createProject.mutateAsync({
  name: "Subproject",
  parentId: "parent-project-id"
});

// Reorder projects
await reorderProjects.mutateAsync({
  items: [
    { id: "project-1", position: 0, parentId: null },
    { id: "project-2", position: 1, parentId: null },
    { id: "subproject-1", position: 0, parentId: "project-1" }
  ]
});
```

### Project Statistics

Projects automatically include task statistics:

```typescript
interface ProjectStats {
  tasks: number;           // Total tasks
  activeTasks: number;     // Active tasks
  completedTasks: number;  // Completed tasks
}
```

## Best Practices

### Project Organization
- Use descriptive names and colors
- Create logical hierarchies
- Archive completed projects instead of deleting
- Use favorites for frequently accessed projects

### Performance
- Projects are cached with React Query
- Database indexes ensure fast queries
- Lazy loading for large project lists

### User Experience
- Visual feedback for all actions
- Confirmation dialogs for destructive operations
- Keyboard shortcuts for power users
- Responsive design for mobile devices

## Troubleshooting

### Common Issues

1. **Migration Errors**: Ensure database connection and permissions
2. **Type Errors**: Run `npx prisma generate` after schema changes
3. **Missing Data**: Check if migration completed successfully

### Debug Mode

Enable debug logging:
```typescript
// In development
const { data: projects } = useProjects({ 
  includeArchived: true,
  _debug: true 
});
```

## Future Enhancements

### Planned Features
- Project templates
- Team collaboration
- Advanced filtering and search
- Project timelines/Gantt charts
- Export/import functionality

### API Extensions
- Webhook support
- Bulk operations API
- Project analytics
- Integration with external tools

## Contributing

When contributing to the project system:

1. Follow the existing code patterns
2. Update TypeScript types for new features
3. Add comprehensive tests
4. Update documentation
5. Consider backward compatibility

## Support

For issues or questions about the project system:
- Check the troubleshooting section
- Review the API documentation
- Create an issue in the project repository

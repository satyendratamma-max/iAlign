# iAlign - Frequently Asked Questions (FAQ)

## Table of Contents
1. [General Questions](#general-questions)
2. [Scenarios & Planning](#scenarios--planning)
3. [Resource Allocation](#resource-allocation)
4. [Match Score Calculation](#match-score-calculation)
5. [Project Management](#project-management)
6. [User Management](#user-management)
7. [Troubleshooting](#troubleshooting)

---

## General Questions

### What is iAlign?
iAlign is an enterprise resource capacity planning platform designed for IT portfolio management, resource allocation, pipeline management, and capacity planning with AI-powered insights.

### Who can use iAlign?
iAlign supports multiple user roles:
- **Administrator**: Full system access and configuration
- **Domain Manager**: Domain-level resource and project management
- **Portfolio Manager**: Portfolio governance and tracking
- **Resource Manager**: Resource allocation and management
- **Analyst**: Data analysis and reporting
- **User**: Basic access to view assigned projects

### How do I access the system?
The application is available at:
- Frontend: http://localhost:3000 (or your configured URL)
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

---

## Scenarios & Planning

### What is a Scenario?
A scenario is a planning workspace that allows you to model different resource allocation strategies and project timelines without affecting production data. Each scenario maintains its own set of projects, resource allocations, and milestones.

### What are the types of Scenarios?

#### Published Scenarios
- **Status**: Locked and read-only
- **Visibility**: Available to all users
- **Purpose**: Represents approved/baseline plans
- **Limit**: No limit
- **Who can publish**: Administrators and Domain Managers only

#### Planned Scenarios
- **Status**: Editable and in-progress
- **Visibility**: Only visible to the creator and administrators
- **Purpose**: Draft planning and what-if analysis
- **Limit**: Maximum 2 per user (unlimited for admins)
- **Who can create**: All users (subject to limits)

### How do I create a new Scenario?
1. Navigate to Admin > Scenario Management
2. Click "Create Scenario"
3. Enter a name and description
4. Click "Create"

**Note**: Regular users can create up to 2 planned scenarios at a time. Delete or publish existing planned scenarios to create new ones.

### How do I clone a Scenario?
1. Go to Admin > Scenario Management
2. Find the scenario you want to clone
3. Click the clone icon
4. Enter a new name and description
5. Click "Clone"

This creates a complete copy of all projects, resources, milestones, and dependencies.

### How do I publish a Scenario?
1. Go to Admin > Scenario Management
2. Find your planned scenario
3. Click the publish icon (Administrators and Domain Managers only)
4. Confirm publication

**Warning**: Publishing locks the scenario and makes it read-only.

### Can I edit a Published Scenario?
No, published scenarios are read-only. To make changes:
1. Clone the published scenario
2. Make your changes in the new scenario
3. Publish the new scenario when ready

---

## Resource Allocation

### How do I allocate a resource to a project?

#### From Projects Page:
1. Go to Projects
2. Find your project
3. Click "View Resources"
4. Click "Add Allocation"
5. Fill in the allocation details
6. Review the match score
7. Click "Allocate"

#### From Resources Page:
1. Go to Resources
2. Find the resource
3. Click "Allocate" or "View Allocations"
4. Select the project
5. Fill in allocation details
6. Review the match score
7. Click "Allocate"

### What is Resource Capability?
Resource Capability represents a skill set that a resource possesses, defined by:
- **Application**: The software or system they work with
- **Technology**: The programming language or tech stack
- **Role**: Their job function (Developer, Analyst, etc.)
- **Proficiency Level**: Beginner, Intermediate, Advanced, or Expert
- **Years of Experience**: How long they've worked with this skill
- **Primary Flag**: Whether this is their main/strongest skill

### What is Project Requirement?
Project Requirement represents a skill needed for a project, defined by:
- **Application**: The software or system involved
- **Technology**: The tech stack required
- **Role**: The job function needed
- **Proficiency Level**: Minimum proficiency required
- **Minimum Years of Experience**: Minimum experience required
- **Required Count**: How many resources are needed
- **Fulfilled Count**: How many allocations already exist

### How do I edit an existing allocation?
1. Go to Projects
2. Click "View Resources" on the project
3. Find the allocation you want to edit
4. Click the Edit icon
5. Update the details
6. Review the updated match score
7. Click "Update"

### How do I delete an allocation?
1. Go to Projects
2. Click "View Resources" on the project
3. Find the allocation
4. Click the Delete icon
5. Confirm deletion

---

## Match Score Calculation

### What is Match Score?
Match Score is a percentage (0-100%) that indicates how well a resource's capabilities match a project's requirements. Higher scores indicate better fits.

### How is Match Score calculated?
The match score is calculated using four weighted components:

#### 1. Exact Match (40 points)
- All three must match: Application, Technology, and Role
- **Full Points**: All three match exactly
- **Zero Points**: If any component doesn't match

#### 2. Proficiency Level (30 points)
Compares the resource's proficiency against the requirement:
- **Beginner** = 1 point
- **Intermediate** = 2 points
- **Advanced** = 3 points
- **Expert** = 4 points

**Scoring Logic**:
- **Exact Match**: Full 30 points (resource matches required level)
- **Exceeds Requirement**: Slight penalty (e.g., Expert vs Advanced = 27 points)
- **Below Requirement**: Penalty increases with gap (e.g., Beginner vs Advanced = 12 points)

#### 3. Years of Experience (20 points)
Compares resource's years of experience against requirement's minimum:
- **Meets or Exceeds**: Up to 20 points
- **Exact Match**: Full 20 points
- **Above Requirement**: Slight penalty for being overqualified
- **Below Requirement**: Penalty increases with gap

If no experience requirement is specified, full 20 points are awarded.

#### 4. Primary Capability Bonus (10 points)
- **Primary Skill**: Full 10 points
- **Secondary Skill**: 7 points

### Match Score Ranges

| Score Range | Label | Meaning |
|------------|-------|---------|
| 80-100% | Excellent Match | Perfect or near-perfect fit |
| 60-79% | Good Match | Solid fit, minor gaps |
| 40-59% | Fair Match | Acceptable but has some gaps |
| 0-39% | Poor Match | Significant skill gaps |

### Example Calculation

**Scenario**: Allocating a Senior Java Developer to a Java Backend Development project

**Resource Capability**:
- App: Enterprise Portal
- Technology: Java
- Role: Developer
- Proficiency: Advanced
- Years of Experience: 6 years
- Is Primary: Yes

**Project Requirement**:
- App: Enterprise Portal
- Technology: Java
- Role: Developer
- Proficiency: Intermediate
- Minimum Years: 4 years

**Calculation**:
1. **Exact Match**: 40 points (App ✓, Technology ✓, Role ✓)
2. **Proficiency**: 27 points (Advanced exceeds Intermediate, slight penalty)
3. **Experience**: 19 points (6 years exceeds 4 years, slight penalty)
4. **Primary**: 10 points (Yes)

**Total Match Score**: 96% (Excellent Match)

### Where can I see Match Scores?

Match scores are displayed in:
1. **Quick Allocation Dialog**: Real-time preview when selecting capability and requirement
2. **View Resources Dialog**: Match score column with progress bar
3. **Resource Allocation Page**: Match score filter and display
4. **Reports**: Resource allocation reports with match quality metrics

### Can I allocate resources with low match scores?
Yes, but it's not recommended. The system allows you to allocate any resource to any project, but low match scores indicate:
- The resource may lack required skills
- They may need additional training
- Project success could be at risk
- Consider finding a better-matched resource or upskilling the current resource

---

## Project Management

### How do I create a project?
1. Navigate to Projects
2. Click "Add Project"
3. Fill in project details:
   - Basic information (name, description, dates)
   - Select segment function and domain
   - Set status, priority, and health
   - Add budget information
4. Click "Save"

### How do I add requirements to a project?
1. Open the project
2. Go to the "Requirements" tab
3. Click "Add Requirement"
4. Select Application, Technology, and Role
5. Set proficiency level and years of experience
6. Specify required count
7. Click "Save"

### How do I add milestones to a project?
1. Open the project
2. Go to the "Milestones" tab
3. Click "Add Milestone"
4. Enter milestone details
5. Set planned dates
6. Click "Save"

### What are the project views available?
- **List View**: Table view with sorting and filtering
- **Gantt View**: Timeline visualization with dependencies
- **Kanban View**: Card-based status board

### How do I manage project dependencies?
1. Open the project in Gantt View
2. Click on a milestone
3. Add dependencies to other milestones
4. Arrows will show dependency relationships
5. System prevents circular dependencies

---

## User Management

### How do I create a new user?
**For Administrators only**:
1. Go to Admin > Access Provisioning
2. Click "Add User"
3. Enter user details
4. Assign a role
5. Click "Create"

### How do I reset a user's password?
**For Administrators only**:
1. Go to Admin > Access Provisioning
2. Find the user
3. Click the reset password icon
4. Provide the new temporary password to the user

### How do I change my role?
Only administrators can change user roles. Contact your system administrator if you need a role change.

### What permissions do different roles have?

| Feature | Admin | Domain Manager | User |
|---------|-------|----------------|------|
| Create Scenarios | Unlimited | Unlimited | Max 2 planned |
| Publish Scenarios | ✓ | ✓ | ✗ |
| Delete Scenarios | ✓ | ✓ | Own only |
| Manage Users | ✓ | ✗ | ✗ |
| Allocate Resources | ✓ | ✓ | Domain only |
| View All Projects | ✓ | ✓ | Assigned only |
| Edit Projects | ✓ | Domain only | Assigned only |
| Access Admin Tools | ✓ | Partial | ✗ |

---

## Troubleshooting

### I can't create a new scenario
**Possible Reasons**:
1. You've reached the limit of 2 planned scenarios (for non-admin users)
2. **Solution**: Delete or publish an existing planned scenario

### My match scores show 0%
**Possible Reasons**:
1. The capability and requirement don't match (different App/Technology/Role)
2. **Solution**: Select a different capability or requirement that matches

### I don't see a project in my scenario
**Possible Reasons**:
1. The project belongs to a different scenario
2. The project is inactive
3. **Solution**: Check that you're in the correct scenario, or check if the project is active

### I can't edit a published scenario
**Expected Behavior**: Published scenarios are read-only by design
**Solution**: Clone the scenario and make changes in the new copy

### Resources show over-allocated
**Meaning**: The total allocation percentage for a resource exceeds 100%
**Solution**:
1. Check the resource's current allocations
2. Adjust allocation percentages
3. Consider deallocating from lower-priority projects

### I don't see the Admin menu
**Reason**: Your role doesn't have admin access
**Solution**: Contact your administrator if you need admin permissions

### Match score doesn't update
**Try**:
1. Change the capability or requirement selection
2. Refresh the page
3. Clear browser cache
4. If problem persists, contact support

---

## Additional Resources

### Where can I find more documentation?
- [API Documentation](http://localhost:5000/api-docs)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Requirements Documentation](./REQUIREMENTS.md)
- [Database Schema](./database/schema.md)

### How do I report a bug or request a feature?
Contact your system administrator or email: support@ialign.com

### Where can I see the latest updates?
Check the project's CHANGELOG.md file or your organization's release notes.

---

**Last Updated**: October 2024
**Version**: 1.0.0

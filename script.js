document.addEventListener('DOMContentLoaded', function() {
    // URL routing system
    const router = {
        routes: {
            '#dashboard': 'dashboard',
            '#portfolio-overview': 'portfolio-overview',
            '#projects': 'projects',
            '#portfolio-analytics': 'portfolio-analytics',
            '#resource-overview': 'resource-overview',
            '#resources': 'resources',
            '#resource-allocation': 'resource-allocation',
            '#resource-capacity': 'resource-capacity',
            '#pipeline-overview': 'pipeline-overview',
            '#pipelines': 'pipelines',
            '#pipeline-requests': 'pipeline-requests',
            '#pipeline-reservations': 'pipeline-reservations',
            '#pipeline-capacity': 'pipeline-capacity',
            '#capacity-overview': 'capacity-overview',
            '#capacity-planning': 'capacity-planning',
            '#scenario-modeling': 'scenario-modeling',
            '#testing': 'testing',
            '#analytics': 'analytics',
            '#about': 'about',
            '#architecture': 'architecture',
            '#data-model': 'data-model'
        },

        init() {
            // Handle initial page load
            const currentHash = window.location.hash || '#dashboard';
            this.navigateToPage(currentHash);

            // Handle hash changes (back/forward buttons)
            window.addEventListener('hashchange', () => {
                this.navigateToPage(window.location.hash);
            });
        },

        navigateToPage(hash) {
            const page = this.routes[hash] || 'dashboard';
            console.log('Router navigating to:', page, 'from hash:', hash); // Debug log

            // Call the global showPage function
            window.showPage(page);

            // Update hash if needed (for programmatic navigation)
            if (window.location.hash !== hash) {
                window.location.hash = hash;
            }
        }
    };

    // Enhanced menu functionality with toggle support
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebar-close');
    const mainContent = document.querySelector('.main-content');

    // Toggle sidebar function
    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
    }

    // Menu toggle click handler
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        if (window.innerWidth <= 768) {
            // Mobile: show/hide sidebar completely
            sidebar.classList.toggle('collapsed');
        } else {
            // Desktop: toggle between full and mini sidebar
            toggleSidebar();
        }
    });

    // Sidebar close button (mobile only)
    sidebarClose.addEventListener('click', function() {
        sidebar.classList.add('collapsed');
        if (window.innerWidth > 768) {
            mainContent.classList.remove('sidebar-collapsed');
        }
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                sidebar.classList.add('collapsed');
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            // Desktop: ensure proper collapsed state
            if (sidebar.classList.contains('collapsed')) {
                mainContent.classList.add('sidebar-collapsed');
            }
        } else {
            // Mobile: reset main content margin
            mainContent.classList.remove('sidebar-collapsed');
        }
    });

    // AI Insights Panel functionality
    const aiInsightsToggle = document.getElementById('ai-insights-toggle');
    const aiInsightsPanel = document.getElementById('ai-insights-panel');
    const aiPanelClose = document.getElementById('ai-panel-close');

    aiInsightsToggle.addEventListener('click', function() {
        aiInsightsPanel.classList.toggle('active');
    });

    aiPanelClose.addEventListener('click', function() {
        aiInsightsPanel.classList.remove('active');
    });

    // AI Insight card actions
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('btn-apply')) {
            const card = event.target.closest('.ai-insight-card');
            card.style.opacity = '0.5';
            event.target.textContent = 'Applied';
            event.target.disabled = true;

            // Simulate applying the recommendation
            setTimeout(() => {
                card.style.display = 'none';
            }, 1000);
        }

        if (event.target.classList.contains('btn-dismiss')) {
            const card = event.target.closest('.ai-insight-card');
            card.style.opacity = '0';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });

    // Enhanced navigation functionality with URL routing
    let navItems = document.querySelectorAll('.nav-item');
    let pages = document.querySelectorAll('.page-content');
    const pageTitle = document.getElementById('page-title');

    // Page titles mapping
    const pageTitles = {
        dashboard: 'Executive Dashboard',
        'portfolio-overview': 'Portfolio Overview',
        projects: 'Project Management',
        'portfolio-analytics': 'Portfolio Analytics',
        'resource-overview': 'Resource Overview',
        resources: 'Domain Teams',
        'resource-allocation': 'Resource Allocation',
        'resource-capacity': 'Resource Capacity',
        'pipeline-overview': 'Pipeline Overview',
        pipelines: 'Environment Catalog',
        'pipeline-requests': 'Capacity Requests',
        'pipeline-reservations': 'Reservations',
        'pipeline-capacity': 'Pipeline Capacity',
        'capacity-overview': 'Capacity Dashboard',
        'capacity-planning': 'Capacity Planning',
        'scenario-modeling': 'Scenario Modeling',
        testing: 'End-to-End Testing',
        analytics: 'Executive Analytics',
        about: 'About',
        architecture: 'Architecture',
        'data-model': 'Data Model'
    };

    // Show page function (make it globally accessible)
    window.showPage = function(targetPage) {
        console.log('Showing page:', targetPage); // Debug log

        // Re-query elements to ensure we have the latest DOM state
        navItems = document.querySelectorAll('.nav-item');
        pages = document.querySelectorAll('.page-content');

        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        const activeNavItem = document.querySelector(`[data-page="${targetPage}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Show target page, hide others
        pages.forEach(page => {
            page.classList.add('hidden');
        });

        const targetPageElement = document.getElementById(`${targetPage}-page`);
        if (targetPageElement) {
            targetPageElement.classList.remove('hidden');
            console.log('Page shown:', targetPageElement.id); // Debug log
        } else {
            console.error('Page element not found:', `${targetPage}-page`); // Debug log
        }

        // Update page title
        if (pageTitle) {
            pageTitle.textContent = pageTitles[targetPage] || 'Executive Dashboard';
        }

        // Update AI insights based on current page
        if (typeof updateAIInsights === 'function') {
            updateAIInsights(targetPage);
        }

        // Update document title for browser tab
        document.title = `iAlign - ${pageTitles[targetPage] || 'Executive Dashboard'}`;
    }

    // Navigation click handlers with URL routing
    function attachNavigationHandlers() {
        const allNavItems = document.querySelectorAll('.nav-item');

        allNavItems.forEach(item => {
            // Remove existing listeners to avoid duplicates
            item.removeEventListener('click', handleNavClick);
            item.addEventListener('click', handleNavClick);
        });
    }

    function handleNavClick(e) {
        e.preventDefault();
        e.stopPropagation();

        const targetPage = this.getAttribute('data-page');

        if (targetPage) {
            // Update URL hash
            window.location.hash = `#${targetPage}`;

            // Close mobile sidebar after navigation
            if (window.innerWidth <= 768) {
                sidebar.classList.add('collapsed');
            }
        }
    }

    // Initialize navigation handlers
    attachNavigationHandlers();

    // Initialize router
    router.init();

    // Collapsible module headers functionality
    const moduleHeaders = document.querySelectorAll('.nav-module-header.collapsible');

    // Initialize all modules as expanded by default
    moduleHeaders.forEach(header => {
        const moduleId = header.getAttribute('data-module');
        const moduleItems = document.querySelector(`.nav-module-items[data-module="${moduleId}"]`);

        // Store initial state in localStorage or default to expanded
        const isCollapsed = localStorage.getItem(`module-${moduleId}-collapsed`) === 'true';

        if (isCollapsed) {
            header.classList.add('collapsed');
            if (moduleItems) {
                moduleItems.classList.add('collapsed');
            }
        }
    });

    // Handle module header clicks
    function handleModuleHeaderClick(e) {
        e.preventDefault();
        e.stopPropagation();

        const moduleId = this.getAttribute('data-module');
        const moduleItems = document.querySelector(`.nav-module-items[data-module="${moduleId}"]`);
        const sidebarCollapsed = sidebar.classList.contains('collapsed');

        // Handle collapsed sidebar behavior on desktop
        if (window.innerWidth > 768 && sidebarCollapsed) {
            // For collapsed sidebar, expand the sidebar first
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('sidebar-collapsed');

            // Then expand the module
            if (moduleItems) {
                this.classList.remove('collapsed');
                moduleItems.classList.remove('collapsed');
                localStorage.setItem(`module-${moduleId}-collapsed`, 'false');
            }
            return;
        }

        // Normal behavior for expanded sidebar
        if (moduleItems) {
            // Toggle collapsed state
            const isCurrentlyCollapsed = this.classList.contains('collapsed');

            if (isCurrentlyCollapsed) {
                // Expand
                this.classList.remove('collapsed');
                moduleItems.classList.remove('collapsed');
                localStorage.setItem(`module-${moduleId}-collapsed`, 'false');
            } else {
                // Collapse
                this.classList.add('collapsed');
                moduleItems.classList.add('collapsed');
                localStorage.setItem(`module-${moduleId}-collapsed`, 'true');
            }
        }
    }

    moduleHeaders.forEach(header => {
        header.addEventListener('click', handleModuleHeaderClick);
    });

    // Initialize charts
    initializeCharts();

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        // Implement search functionality here
        console.log('Searching for:', searchTerm);
    });

    // Filter functionality for projects page
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            filterProjects();
        });
    });

    // Mock data for demonstration
    const mockData = {
        projects: [
            {
                id: 1,
                name: 'CRM Modernization',
                description: 'Upgrade legacy CRM system',
                status: 'Active',
                priority: 'Critical',
                progress: 65,
                team: ['JS', 'MK', 'SR'],
                teamCount: 12,
                dependencies: ['Data Migration', 'API Upgrade'],
                deadline: 'Mar 15, 2024',
                assignedTeams: ['Engineering IT', 'Quality']
            },
            {
                id: 2,
                name: 'Cloud Migration',
                description: 'Move infrastructure to AWS',
                status: 'Active',
                priority: 'High',
                progress: 30,
                team: ['AS', 'PL'],
                teamCount: 8,
                dependencies: ['Security Review'],
                deadline: 'May 30, 2024',
                assignedTeams: ['Engineering IT', 'CIO']
            },
            {
                id: 3,
                name: 'Security Audit',
                description: 'Comprehensive security assessment',
                status: 'Active',
                priority: 'High',
                progress: 90,
                team: ['DK', 'LM'],
                teamCount: 5,
                dependencies: [],
                deadline: 'Feb 28, 2024',
                assignedTeams: ['Engineering IT', 'Legal']
            },
            {
                id: 4,
                name: 'Mobile App Development',
                description: 'Native mobile applications',
                status: 'Planning',
                priority: 'Medium',
                progress: 10,
                team: ['RJ', 'TK'],
                teamCount: 6,
                dependencies: ['API Development'],
                deadline: 'Jun 15, 2024',
                assignedTeams: ['Engineering IT', 'Display']
            },
            {
                id: 5,
                name: 'TC/CAD Upgrade',
                description: 'Upgrade Teamcenter and CAD systems integration',
                status: 'Active',
                priority: 'Critical',
                progress: 45,
                team: ['RP', 'KM', 'LT'],
                teamCount: 18,
                dependencies: ['PLM Transition', 'Legacy Data Migration'],
                deadline: 'Sep 30, 2024',
                assignedTeams: ['Engineering IT', 'Make', 'Quality']
            },
            {
                id: 6,
                name: 'PLM Transition',
                description: 'Transition to new Product Lifecycle Management system',
                status: 'Active',
                priority: 'Critical',
                progress: 25,
                team: ['ST', 'BW', 'NH'],
                teamCount: 22,
                dependencies: ['Data Architecture Review', 'Change Management'],
                deadline: 'Dec 15, 2024',
                assignedTeams: ['Engineering IT', 'Make', 'Plan', 'Quality']
            },
            {
                id: 7,
                name: 'PLM AI Integration',
                description: 'Integrate AI capabilities into PLM workflows',
                status: 'Planning',
                priority: 'High',
                progress: 5,
                team: ['AI', 'ML', 'DS'],
                teamCount: 14,
                dependencies: ['PLM Transition', 'AI Platform Setup'],
                deadline: 'Mar 31, 2025',
                assignedTeams: ['Engineering IT', 'DIA', 'Make']
            },
            {
                id: 8,
                name: 'Project Portfolio',
                description: 'Enterprise project portfolio management system',
                status: 'Active',
                priority: 'High',
                progress: 55,
                team: ['PM', 'BA', 'UX'],
                teamCount: 16,
                dependencies: ['Resource Planning Integration', 'Financial Systems'],
                deadline: 'Jul 20, 2024',
                assignedTeams: ['SPG', 'Finance', 'CIO', 'Plan']
            },
            {
                id: 9,
                name: 'Supply Chain Optimization',
                description: 'Digital transformation of supply chain processes',
                status: 'Active',
                priority: 'Medium',
                progress: 35,
                team: ['SC', 'LG', 'AN'],
                teamCount: 11,
                dependencies: ['ERP Integration', 'Vendor Onboarding'],
                deadline: 'Nov 10, 2024',
                assignedTeams: ['Buy', 'Move', 'Trade']
            },
            {
                id: 10,
                name: 'Digital Workplace',
                description: 'Modern collaboration and productivity platform',
                status: 'Planning',
                priority: 'Medium',
                progress: 15,
                team: ['DW', 'IT', 'HR'],
                teamCount: 9,
                dependencies: ['Infrastructure Upgrade', 'Security Compliance'],
                deadline: 'Aug 30, 2024',
                assignedTeams: ['HR', 'Engineering IT', 'Service']
            }
        ],
        resources: {
            total: 2847,
            available: 342,
            utilization: 85,
            domains: [
                {
                    name: 'Engineering & Technology',
                    portfolioManager: 'Sarah Chen',
                    location: 'San Francisco',
                    totalMembers: 245,
                    utilization: 87,
                    cost: 850000,
                    teams: [
                        { name: 'Portfolio Manager', members: 3, utilization: 85, skills: ['Strategy', 'Planning', 'PMO'] },
                        { name: 'Functional Analyst', members: 18, utilization: 82, skills: ['Business Analysis', 'Requirements', 'Process'] },
                        { name: 'Development', members: 168, utilization: 89, skills: ['Cloud', 'DevOps', 'Backend', 'Frontend'] },
                        { name: 'Testing', members: 56, utilization: 84, skills: ['Test Automation', 'QA', 'Performance Testing'] }
                    ]
                },
                {
                    name: 'Quality & Compliance',
                    portfolioManager: 'Michael Rodriguez',
                    location: 'Austin',
                    totalMembers: 156,
                    utilization: 72,
                    cost: 420000,
                    teams: [
                        { name: 'Portfolio Manager', members: 2, utilization: 78, skills: ['Quality Management', 'Compliance'] },
                        { name: 'Functional Analyst', members: 12, utilization: 75, skills: ['Quality Analysis', 'Process Improvement'] },
                        { name: 'Development', members: 87, utilization: 71, skills: ['Quality Tools', 'Automation', 'Standards'] },
                        { name: 'Testing', members: 55, utilization: 73, skills: ['Quality Testing', 'Validation', 'Auditing'] }
                    ]
                },
                {
                    name: 'Manufacturing & Operations',
                    portfolioManager: 'Jennifer Williams',
                    location: 'Detroit',
                    totalMembers: 432,
                    utilization: 93,
                    cost: 1200000,
                    teams: [
                        { name: 'Portfolio Manager', members: 6, utilization: 88, skills: ['Operations Management', 'Lean'] },
                        { name: 'Functional Analyst', members: 35, utilization: 91, skills: ['Process Analysis', 'Manufacturing Systems'] },
                        { name: 'Development', members: 278, utilization: 95, skills: ['Manufacturing Systems', 'Automation', 'IoT'] },
                        { name: 'Testing', members: 113, utilization: 92, skills: ['System Testing', 'Integration Testing'] }
                    ]
                },
                {
                    name: 'Sales & Customer',
                    portfolioManager: 'David Thompson',
                    location: 'New York',
                    totalMembers: 287,
                    utilization: 89,
                    cost: 980000,
                    teams: [
                        { name: 'Portfolio Manager', members: 4, utilization: 85, skills: ['Sales Strategy', 'Customer Management'] },
                        { name: 'Functional Analyst', members: 23, utilization: 87, skills: ['Sales Analytics', 'CRM Analysis'] },
                        { name: 'Development', members: 180, utilization: 91, skills: ['CRM', 'Sales Systems', 'Customer Portal'] },
                        { name: 'Testing', members: 80, utilization: 88, skills: ['User Acceptance Testing', 'CRM Testing'] }
                    ]
                },
                {
                    name: 'Finance & Planning',
                    portfolioManager: 'Lisa Davis',
                    location: 'Chicago',
                    totalMembers: 187,
                    utilization: 75,
                    cost: 945000,
                    teams: [
                        { name: 'Portfolio Manager', members: 3, utilization: 82, skills: ['Financial Planning', 'Budget Management'] },
                        { name: 'Functional Analyst', members: 15, utilization: 78, skills: ['Financial Analysis', 'Planning Systems'] },
                        { name: 'Development', members: 125, utilization: 74, skills: ['SAP', 'Financial Systems', 'Reporting'] },
                        { name: 'Testing', members: 44, utilization: 73, skills: ['Financial Testing', 'Data Validation'] }
                    ]
                },
                {
                    name: 'Supply Chain & Logistics',
                    portfolioManager: 'Robert Johnson',
                    location: 'Atlanta',
                    totalMembers: 201,
                    utilization: 85,
                    cost: 970000,
                    teams: [
                        { name: 'Portfolio Manager', members: 3, utilization: 87, skills: ['Supply Chain Strategy', 'Logistics'] },
                        { name: 'Functional Analyst', members: 16, utilization: 83, skills: ['Supply Chain Analysis', 'Procurement'] },
                        { name: 'Development', members: 134, utilization: 86, skills: ['SCM Systems', 'Transportation', 'Procurement'] },
                        { name: 'Testing', members: 48, utilization: 84, skills: ['Supply Chain Testing', 'Integration Testing'] }
                    ]
                }
            ]
        },
        pipelines: {
            environments: [
                {
                    id: 'sap-prod',
                    name: 'SAP Production',
                    type: 'SAP',
                    status: 'Available',
                    capacity: 100,
                    currentUsage: 73,
                    location: 'Chicago',
                    cost: 25000,
                    reservations: [
                        { project: 'TC/CAD Upgrade', startDate: '2024-02-15', endDate: '2024-03-30', usage: 45 },
                        { project: 'PLM Transition', startDate: '2024-04-01', endDate: '2024-05-15', usage: 28 }
                    ]
                },
                {
                    id: 'sap-dev',
                    name: 'SAP Development',
                    type: 'SAP',
                    status: 'Available',
                    capacity: 80,
                    currentUsage: 45,
                    location: 'Chicago',
                    cost: 15000,
                    reservations: [
                        { project: 'Project Portfolio', startDate: '2024-02-01', endDate: '2024-04-30', usage: 35 }
                    ]
                },
                {
                    id: 'tc-prod',
                    name: 'Teamcenter Production',
                    type: 'Teamcenter',
                    status: 'Available',
                    capacity: 120,
                    currentUsage: 89,
                    location: 'Detroit',
                    cost: 35000,
                    reservations: [
                        { project: 'PLM AI Integration', startDate: '2024-03-01', endDate: '2024-06-30', usage: 67 },
                        { project: 'TC/CAD Upgrade', startDate: '2024-02-15', endDate: '2024-05-30', usage: 22 }
                    ]
                },
                {
                    id: 'tc-test',
                    name: 'Teamcenter Test',
                    type: 'Teamcenter',
                    status: 'Available',
                    capacity: 60,
                    currentUsage: 34,
                    location: 'Detroit',
                    cost: 18000,
                    reservations: [
                        { project: 'PLM Transition', startDate: '2024-02-20', endDate: '2024-04-15', usage: 34 }
                    ]
                },
                {
                    id: 'databricks-analytics',
                    name: 'Databricks Analytics',
                    type: 'Databricks',
                    status: 'Available',
                    capacity: 200,
                    currentUsage: 156,
                    location: 'San Francisco',
                    cost: 45000,
                    reservations: [
                        { project: 'PLM AI Integration', startDate: '2024-02-01', endDate: '2024-07-31', usage: 89 },
                        { project: 'Project Portfolio', startDate: '2024-03-15', endDate: '2024-09-30', usage: 67 }
                    ]
                },
                {
                    id: 'databricks-dev',
                    name: 'Databricks Development',
                    type: 'Databricks',
                    status: 'Available',
                    capacity: 100,
                    currentUsage: 67,
                    location: 'San Francisco',
                    cost: 28000,
                    reservations: [
                        { project: 'PLM AI Integration', startDate: '2024-01-15', endDate: '2024-05-30', usage: 45 },
                        { project: 'TC/CAD Upgrade', startDate: '2024-04-01', endDate: '2024-06-15', usage: 22 }
                    ]
                },
                {
                    id: 'core-plus-prod',
                    name: 'CORE+ Production',
                    type: 'CORE+',
                    status: 'Available',
                    capacity: 150,
                    currentUsage: 112,
                    location: 'New York',
                    cost: 40000,
                    reservations: [
                        { project: 'Project Portfolio', startDate: '2024-01-01', endDate: '2024-12-31', usage: 78 },
                        { project: 'PLM Transition', startDate: '2024-03-01', endDate: '2024-08-15', usage: 34 }
                    ]
                },
                {
                    id: 'core-plus-staging',
                    name: 'CORE+ Staging',
                    type: 'CORE+',
                    status: 'Maintenance',
                    capacity: 75,
                    currentUsage: 0,
                    location: 'New York',
                    cost: 20000,
                    reservations: []
                },
                {
                    id: 'azure-cloud',
                    name: 'Azure Cloud Platform',
                    type: 'Azure',
                    status: 'Available',
                    capacity: 300,
                    currentUsage: 234,
                    location: 'Seattle',
                    cost: 55000,
                    reservations: [
                        { project: 'PLM AI Integration', startDate: '2024-02-01', endDate: '2024-08-31', usage: 123 },
                        { project: 'TC/CAD Upgrade', startDate: '2024-02-15', endDate: '2024-07-30', usage: 67 },
                        { project: 'Project Portfolio', startDate: '2024-01-01', endDate: '2024-12-31', usage: 44 }
                    ]
                },
                {
                    id: 'power-platform',
                    name: 'Power Platform',
                    type: 'Power Platform',
                    status: 'Available',
                    capacity: 80,
                    currentUsage: 45,
                    location: 'Phoenix',
                    cost: 22000,
                    reservations: [
                        { project: 'Project Portfolio', startDate: '2024-02-01', endDate: '2024-06-30', usage: 35 }
                    ]
                }
            ],
            pendingRequests: [
                {
                    id: 'req-001',
                    requestedBy: 'Sarah Chen',
                    domain: 'Engineering & Technology',
                    project: 'PLM AI Integration',
                    pipelineType: 'Databricks',
                    requestedCapacity: 50,
                    startDate: '2024-08-01',
                    endDate: '2024-12-31',
                    justification: 'Additional compute capacity needed for machine learning model training',
                    status: 'Pending Approval',
                    priority: 'High',
                    estimatedCost: 25000
                },
                {
                    id: 'req-002',
                    requestedBy: 'Michael Rodriguez',
                    domain: 'Quality & Compliance',
                    project: 'Quality Analytics Platform',
                    pipelineType: 'Power Platform',
                    requestedCapacity: 30,
                    startDate: '2024-05-01',
                    endDate: '2024-10-31',
                    justification: 'Quality analytics and reporting dashboard development',
                    status: 'Under Review',
                    priority: 'Medium',
                    estimatedCost: 18000
                }
            ]
        },
        locations: {
            'San Francisco': { teams: ['Engineering IT', 'CIO'], totalResources: 279, costMultiplier: 1.4 },
            'Austin': { teams: ['Quality'], totalResources: 156, costMultiplier: 1.1 },
            'Detroit': { teams: ['Make'], totalResources: 432, costMultiplier: 0.9 },
            'New York': { teams: ['Sales'], totalResources: 287, costMultiplier: 1.3 },
            'Chicago': { teams: ['Finance'], totalResources: 89, costMultiplier: 1.2 },
            'Atlanta': { teams: ['Buy'], totalResources: 134, costMultiplier: 1.0 },
            'Memphis': { teams: ['Move'], totalResources: 67, costMultiplier: 0.9 },
            'Boston': { teams: ['Plan'], totalResources: 98, costMultiplier: 1.2 },
            'Phoenix': { teams: ['Service'], totalResources: 203, costMultiplier: 1.0 },
            'Denver': { teams: ['HR'], totalResources: 78, costMultiplier: 1.1 },
            'Miami': { teams: ['Trade'], totalResources: 156, costMultiplier: 1.1 },
            'Washington DC': { teams: ['Legal'], totalResources: 45, costMultiplier: 1.3 },
            'Seattle': { teams: ['SPG'], totalResources: 89, costMultiplier: 1.2 },
            'Los Angeles': { teams: ['Display'], totalResources: 123, costMultiplier: 1.3 },
            'Dallas': { teams: ['DIA'], totalResources: 67, costMultiplier: 1.0 }
        }
    };

    // Project filtering
    function filterProjects() {
        const statusFilter = document.querySelector('.filter-select:nth-child(1)').value;
        const priorityFilter = document.querySelector('.filter-select:nth-child(2)').value;

        console.log('Filtering projects:', { status: statusFilter, priority: priorityFilter });
        // Implement actual filtering logic here
    }

    // Chart initialization
    function initializeCharts() {
        // Resource Allocation Pie Chart
        const resourceCtx = document.getElementById('resourceChart');
        if (resourceCtx) {
            new Chart(resourceCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Engineering IT', 'Quality', 'Make', 'Sales', 'Finance', 'Buy', 'Move', 'Plan', 'Service', 'HR', 'Trade', 'Legal', 'SPG', 'Display', 'DIA', 'CIO'],
                    datasets: [{
                        data: [245, 156, 432, 287, 89, 134, 67, 98, 203, 78, 156, 45, 89, 123, 67, 34],
                        backgroundColor: [
                            '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6',
                            '#a855f7', '#22d3ee', '#65a30d', '#dc2626', '#7c3aed', '#059669'
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }

        // Skills Distribution Chart
        const skillsCtx = document.getElementById('skillsChart');
        if (skillsCtx) {
            new Chart(skillsCtx, {
                type: 'radar',
                data: {
                    labels: ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'Docker'],
                    datasets: [{
                        label: 'Team Skills',
                        data: [85, 70, 60, 90, 75, 65, 80],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        pointBackgroundColor: '#6366f1',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 20
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // Project Completion Trends Chart
        const completionCtx = document.getElementById('completionChart');
        if (completionCtx) {
            new Chart(completionCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Projects Completed',
                        data: [3, 5, 2, 7, 4, 6],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Projects Started',
                        data: [4, 3, 6, 5, 8, 4],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        // Resource Utilization Over Time Chart
        const utilizationCtx = document.getElementById('utilizationChart');
        if (utilizationCtx) {
            new Chart(utilizationCtx, {
                type: 'bar',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                    datasets: [{
                        label: 'Frontend Team',
                        data: [85, 92, 88, 95, 90, 87],
                        backgroundColor: '#6366f1'
                    }, {
                        label: 'Backend Team',
                        data: [78, 85, 82, 88, 85, 83],
                        backgroundColor: '#10b981'
                    }, {
                        label: 'DevOps Team',
                        data: [95, 100, 98, 105, 102, 95],
                        backgroundColor: '#f59e0b'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 120,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Interactive features

    // Hover effects for metric cards
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Project item interactions
    const projectItems = document.querySelectorAll('.project-item');
    projectItems.forEach(item => {
        item.addEventListener('click', function() {
            // Show project details modal or navigate to project detail page
            console.log('Project clicked:', this);
        });
    });

    // Capacity bar hover effects
    const capacityBars = document.querySelectorAll('.capacity-bar');
    capacityBars.forEach(bar => {
        bar.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
            this.style.cursor = 'pointer';
        });

        bar.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
    });

    // Table row hover effects
    const tableRows = document.querySelectorAll('.projects-table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8fafc';
        });

        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
    });

    // Action button handlers
    const editButtons = document.querySelectorAll('[title="Edit"]');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Edit project');
            // Implement edit functionality
        });
    });

    const viewButtons = document.querySelectorAll('[title="View Details"]');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('View project details');
            // Implement view details functionality
        });
    });

    // Real-time updates simulation
    setInterval(() => {
        updateMetrics();
    }, 30000); // Update every 30 seconds

    function updateMetrics() {
        // Simulate real-time metric updates
        const utilizationMetric = document.querySelector('.metric-card:nth-child(2) .metric-info h3');
        if (utilizationMetric) {
            const currentValue = parseInt(utilizationMetric.textContent);
            const newValue = Math.max(70, Math.min(100, currentValue + Math.floor(Math.random() * 6) - 3));
            utilizationMetric.textContent = newValue + '%';
        }
    }

    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
            color: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    document.querySelector('[data-page="dashboard"]').click();
                    break;
                case '2':
                    e.preventDefault();
                    document.querySelector('[data-page="projects"]').click();
                    break;
                case '3':
                    e.preventDefault();
                    document.querySelector('[data-page="resources"]').click();
                    break;
                case '4':
                    e.preventDefault();
                    document.querySelector('[data-page="capacity"]').click();
                    break;
                case '5':
                    e.preventDefault();
                    document.querySelector('[data-page="analytics"]').click();
                    break;
                case 'k':
                    e.preventDefault();
                    document.querySelector('.search-box input').focus();
                    break;
            }
        }
    });

    // Responsive menu toggle for mobile
    function createMobileMenuToggle() {
        const mobileToggle = document.createElement('button');
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.style.cssText = `
            display: none;
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 1001;
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 0.75rem;
            border-radius: 0.5rem;
            cursor: pointer;
        `;

        document.body.appendChild(mobileToggle);

        mobileToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            const isOpen = sidebar.style.transform === 'translateX(0px)';
            sidebar.style.transform = isOpen ? 'translateX(-100%)' : 'translateX(0px)';
        });

        // Show/hide toggle based on screen size
        function checkScreenSize() {
            if (window.innerWidth <= 768) {
                mobileToggle.style.display = 'block';
            } else {
                mobileToggle.style.display = 'none';
                document.querySelector('.sidebar').style.transform = '';
            }
        }

        window.addEventListener('resize', checkScreenSize);
        checkScreenSize();
    }

    createMobileMenuToggle();

    // Initialize tooltips
    function initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[title]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', function(e) {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = this.getAttribute('title');
                tooltip.style.cssText = `
                    position: absolute;
                    background: #1e293b;
                    color: white;
                    padding: 0.5rem 0.75rem;
                    border-radius: 0.25rem;
                    font-size: 0.875rem;
                    white-space: nowrap;
                    z-index: 1000;
                    pointer-events: none;
                `;

                document.body.appendChild(tooltip);

                const rect = this.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
            });

            element.addEventListener('mouseleave', function() {
                const tooltip = document.querySelector('.tooltip');
                if (tooltip) {
                    document.body.removeChild(tooltip);
                }
            });
        });
    }

    initializeTooltips();

    // Resource Loading Page functionality
    const viewToggleButtons = document.querySelectorAll('.btn-toggle');
    viewToggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const viewType = this.getAttribute('data-view');
            const tableView = document.getElementById('team-table-view');
            const chartView = document.getElementById('team-chart-view');

            viewToggleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            if (viewType === 'table') {
                tableView.classList.remove('hidden');
                chartView.classList.add('hidden');
            } else {
                tableView.classList.add('hidden');
                chartView.classList.remove('hidden');
                // Initialize team breakdown chart if not already done
                initializeTeamBreakdownChart();
            }
        });
    });

    // Initialize additional charts for new pages
    function initializeTeamBreakdownChart() {
        const ctx = document.getElementById('teamBreakdownChart');
        if (ctx && !ctx.chart) {
            ctx.chart = new Chart(ctx, {
                type: 'bubble',
                data: {
                    datasets: [{
                        label: 'Teams',
                        data: mockData.resources.teams.map(team => ({
                            x: team.utilization,
                            y: team.cost / 1000,
                            r: team.members / 10,
                            label: team.name
                        })),
                        backgroundColor: 'rgba(99, 102, 241, 0.6)',
                        borderColor: '#6366f1',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Utilization (%)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Cost (K/Month)'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.raw.label}: ${context.parsed.x}% utilization, $${context.parsed.y}K/month, ${Math.round(context.raw.r * 10)} members`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    function initializeSkillsMatrixChart() {
        const ctx = document.getElementById('skillsMatrixChart');
        if (ctx && !ctx.chart) {
            ctx.chart = new Chart(ctx, {
                type: 'heatmap',
                data: {
                    labels: ['Cloud', 'DevOps', 'Security', 'QA', 'Manufacturing', 'Sales', 'Finance', 'Procurement', 'Logistics', 'Planning'],
                    datasets: [{
                        label: 'Skill Proficiency',
                        data: [
                            {x: 0, y: 0, v: 85}, {x: 1, y: 0, v: 90}, {x: 2, y: 0, v: 88},
                            {x: 3, y: 1, v: 85}, {x: 3, y: 1, v: 90},
                            {x: 4, y: 2, v: 95}, {x: 4, y: 2, v: 88},
                            {x: 5, y: 3, v: 90}, {x: 5, y: 3, v: 85},
                            {x: 6, y: 4, v: 85}, {x: 6, y: 4, v: 90}
                        ],
                        backgroundColor: function(ctx) {
                            const value = ctx.parsed.v;
                            const alpha = value / 100;
                            return `rgba(99, 102, 241, ${alpha})`;
                        }
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom'
                        },
                        y: {
                            type: 'linear'
                        }
                    }
                }
            });
        }
    }

    function initializeCostCharts() {
        // Cost by Team Chart
        const costByTeamCtx = document.getElementById('costByTeamChart');
        if (costByTeamCtx && !costByTeamCtx.chart) {
            costByTeamCtx.chart = new Chart(costByTeamCtx, {
                type: 'bar',
                data: {
                    labels: mockData.resources.teams.slice(0, 8).map(team => team.name),
                    datasets: [{
                        label: 'Monthly Cost ($K)',
                        data: mockData.resources.teams.slice(0, 8).map(team => team.cost / 1000),
                        backgroundColor: '#6366f1',
                        borderColor: '#4f46e5',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Cost (K/Month)'
                            }
                        }
                    }
                }
            });
        }

        // Cost by Location Chart
        const costByLocationCtx = document.getElementById('costByLocationChart');
        if (costByLocationCtx && !costByLocationCtx.chart) {
            const locationData = Object.entries(mockData.locations || {}).slice(0, 6);
            costByLocationCtx.chart = new Chart(costByLocationCtx, {
                type: 'doughnut',
                data: {
                    labels: locationData.map(([location]) => location),
                    datasets: [{
                        data: locationData.map(([, data]) => data.totalResources * 150),
                        backgroundColor: [
                            '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Cost Trends Chart
        const costTrendsCtx = document.getElementById('costTrendsChart');
        if (costTrendsCtx && !costTrendsCtx.chart) {
            costTrendsCtx.chart = new Chart(costTrendsCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Total Cost',
                        data: [3200, 3350, 3180, 3420, 3380, 3500],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Budget',
                        data: [3500, 3500, 3500, 3500, 3500, 3500],
                        borderColor: '#ef4444',
                        borderDash: [5, 5],
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'Cost ($K)'
                            }
                        }
                    }
                }
            });
        }
    }

    // Enhanced capacity planning functionality
    function updateCapacityScenario() {
        const scenarioSelector = document.querySelector('.scenario-selector select');
        const timeRangeSelector = document.querySelector('.time-range select');

        if (scenarioSelector && timeRangeSelector) {
            scenarioSelector.addEventListener('change', function() {
                console.log('Scenario changed to:', this.value);
                // Update capacity visualization based on scenario
            });

            timeRangeSelector.addEventListener('change', function() {
                console.log('Time range changed to:', this.value);
                // Update time range for capacity planning
            });
        }
    }

    // Enhanced bottleneck detection
    function identifyBottlenecks() {
        const teams = mockData.resources.teams;
        const bottlenecks = teams.filter(team => team.utilization > 90);

        console.log('Identified bottlenecks:', bottlenecks.map(team => ({
            name: team.name,
            utilization: team.utilization,
            severity: team.utilization > 95 ? 'Critical' : 'High'
        })));

        return bottlenecks;
    }

    // Skills filter functionality
    const skillFilter = document.querySelector('.skill-filter');
    if (skillFilter) {
        skillFilter.addEventListener('change', function() {
            const selectedCategory = this.value;
            console.log('Filtering skills by category:', selectedCategory);
            // Implement skill filtering logic
        });
    }

    // Initialize all charts when navigating to respective pages
    function initializePageSpecificCharts(pageId) {
        switch(pageId) {
            case 'resource-loading-page':
                setTimeout(() => {
                    initializeTeamBreakdownChart();
                    initializeSkillsMatrixChart();
                    initializeCostCharts();
                }, 100);
                break;
            case 'capacity-page':
                updateCapacityScenario();
                identifyBottlenecks();
                break;
        }
    }

    // Enhanced navigation with chart initialization
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            const targetPageElement = document.getElementById(`${targetPage}-page`);

            if (targetPageElement) {
                // Initialize page-specific functionality
                initializePageSpecificCharts(`${targetPage}-page`);
            }
        });
    });

    // Enhanced keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    document.querySelector('[data-page="dashboard"]').click();
                    break;
                case '2':
                    e.preventDefault();
                    document.querySelector('[data-page="projects"]').click();
                    break;
                case '3':
                    e.preventDefault();
                    document.querySelector('[data-page="resources"]').click();
                    break;
                case '4':
                    e.preventDefault();
                    document.querySelector('[data-page="resource-loading"]').click();
                    break;
                case '5':
                    e.preventDefault();
                    document.querySelector('[data-page="capacity"]').click();
                    break;
                case '6':
                    e.preventDefault();
                    document.querySelector('[data-page="analytics"]').click();
                    break;
                case '7':
                    e.preventDefault();
                    document.querySelector('[data-page="about"]').click();
                    break;
                case '8':
                    e.preventDefault();
                    document.querySelector('[data-page="data-model"]').click();
                    break;
                case 'k':
                    e.preventDefault();
                    document.querySelector('.search-box input').focus();
                    break;
            }
        }
    });

    // Advanced search functionality
    function enhancedSearch(searchTerm) {
        const results = {
            projects: mockData.projects.filter(project =>
                project.name.toLowerCase().includes(searchTerm) ||
                project.description.toLowerCase().includes(searchTerm)
            ),
            teams: mockData.resources.teams.filter(team =>
                team.name.toLowerCase().includes(searchTerm) ||
                team.skills.some(skill => skill.toLowerCase().includes(searchTerm))
            )
        };

        return results;
    }

    // Update search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        if (searchTerm.length > 2) {
            const results = enhancedSearch(searchTerm);
            console.log('Search results:', results);
            // Implement search results display
        }
    });

    // Initialize capacity planning updates
    updateCapacityScenario();

    // Demo notification on load
    setTimeout(() => {
        showNotification('Welcome to Enterprise Resource Planning Dashboard!', 'success');
    }, 1000);

    // Function to update AI insights based on current page
    window.updateAIInsights = function(currentPage) {
        const aiInsightsContent = document.querySelector('.ai-insights-content');
        if (!aiInsightsContent) return;

        const pageInsights = {
            dashboard: [
                {
                    type: 'critical',
                    icon: 'fas fa-exclamation-triangle',
                    title: 'Resource Bottleneck Alert',
                    content: 'Engineering IT team is at 98% capacity. Consider reallocating 2 developers from PLM AI Integration to TC/CAD Upgrade to balance workload.',
                    confidence: '94%'
                },
                {
                    type: 'success',
                    icon: 'fas fa-lightbulb',
                    title: 'Optimal Resource Allocation',
                    content: 'Cross-train 3 Quality team members in PLM processes. This will reduce dependency risks by 45% and improve project delivery by 2 weeks.',
                    confidence: '87%'
                },
                {
                    type: 'info',
                    icon: 'fas fa-chart-line',
                    title: 'Budget Optimization',
                    content: 'Shift 15% of Project Portfolio budget to PLM Transition for Q2. This alignment will maximize ROI and reduce overall project risk by 23%.',
                    confidence: '91%'
                }
            ],
            projects: [
                {
                    type: 'critical',
                    icon: 'fas fa-calendar-times',
                    title: 'Schedule Risk Alert',
                    content: 'TC/CAD Upgrade project has 78% chance of delay due to Quality team dependencies. Recommend parallel testing approach.',
                    confidence: '89%'
                },
                {
                    type: 'success',
                    icon: 'fas fa-sync-alt',
                    title: 'Cross-Project Synergy',
                    content: 'Combine PLM Transition and PLM AI Integration phases 2-3. This could save 6 weeks and reduce costs by $420K.',
                    confidence: '82%'
                },
                {
                    type: 'info',
                    icon: 'fas fa-users-cog',
                    title: 'Team Optimization',
                    content: 'Engineering IT and Make teams show 93% collaboration efficiency on Project Portfolio. Apply this model to other projects.',
                    confidence: '96%'
                }
            ],
            resources: [
                {
                    type: 'critical',
                    icon: 'fas fa-user-times',
                    title: 'Skill Gap Analysis',
                    content: 'Critical shortage of cloud architects across Engineering IT and CIO teams. Recommend immediate hiring or training program.',
                    confidence: '92%'
                },
                {
                    type: 'success',
                    icon: 'fas fa-graduation-cap',
                    title: 'Training Opportunity',
                    content: 'Legal and Trade teams have 40% unused capacity. Cross-train them in compliance automation for 35% efficiency gain.',
                    confidence: '85%'
                },
                {
                    type: 'info',
                    icon: 'fas fa-chart-pie',
                    title: 'Utilization Insight',
                    content: 'SPG and Display teams are underutilized (62%). Consider resource reallocation to high-priority projects.',
                    confidence: '88%'
                }
            ],
            capacity: [
                {
                    type: 'critical',
                    icon: 'fas fa-tachometer-alt',
                    title: 'Capacity Overflow Warning',
                    content: 'Q3 resource demand exceeds capacity by 23%. Recommend staggered project starts or contractor augmentation.',
                    confidence: '95%'
                },
                {
                    type: 'success',
                    icon: 'fas fa-balance-scale',
                    title: 'Load Balancing Opportunity',
                    content: 'Move 2 PLM AI tasks to Q4 and front-load Project Portfolio work. This smooths capacity and improves delivery by 15%.',
                    confidence: '90%'
                },
                {
                    type: 'info',
                    icon: 'fas fa-clock',
                    title: 'Optimal Timing',
                    content: 'Start TC/CAD Upgrade 3 weeks earlier while Engineering IT has 15% buffer capacity. Risk reduction: 31%.',
                    confidence: '86%'
                }
            ],
            analytics: [
                {
                    type: 'critical',
                    icon: 'fas fa-chart-line',
                    title: 'Performance Trend Alert',
                    content: 'Project delivery velocity decreased 12% over last quarter. Root cause: insufficient cross-team collaboration.',
                    confidence: '93%'
                },
                {
                    type: 'success',
                    icon: 'fas fa-trophy',
                    title: 'High-Performance Pattern',
                    content: 'Engineering IT + Quality combination shows 127% efficiency. Replicate this pairing for critical path activities.',
                    confidence: '91%'
                },
                {
                    type: 'info',
                    icon: 'fas fa-target',
                    title: 'ROI Optimization',
                    content: 'Focus 68% of resources on PLM projects for maximum business impact. Projected ROI increase: 34%.',
                    confidence: '89%'
                }
            ]
        };

        const insights = pageInsights[currentPage] || pageInsights.dashboard;

        aiInsightsContent.innerHTML = insights.map(insight => `
            <div class="ai-insight-card ${insight.type}">
                <div class="insight-icon">
                    <i class="${insight.icon}"></i>
                </div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.content}</p>
                    <div class="insight-confidence">
                        <span class="confidence-label">Confidence:</span>
                        <span class="confidence-score">${insight.confidence}</span>
                    </div>
                </div>
                <div class="insight-actions">
                    <button class="btn-apply">Apply</button>
                    <button class="btn-dismiss">Dismiss</button>
                </div>
            </div>
        `).join('');
    };

    // Initialize with dashboard insights
    updateAIInsights('dashboard');

    // Navigation function for module cards
    window.navigateToPage = function(pageId) {
        // Find the navigation item and trigger click
        const navItem = document.querySelector(`[data-page="${pageId}"]`);
        if (navItem) {
            navItem.click();
        }
    };

    console.log('Enterprise Resource Planning Platform initialized successfully!');
});
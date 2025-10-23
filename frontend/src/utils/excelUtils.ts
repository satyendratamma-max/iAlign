// Excel Import/Export Utilities using native browser APIs (no external dependencies)

export const exportToExcel = (data: any[], filename: string): boolean => {
  if (!data || data.length === 0) {
    return false; // Return false to indicate no data, let caller handle the message
  }

  // Get all unique keys from all objects
  const keys = Array.from(
    new Set(data.flatMap((obj) => Object.keys(obj)))
  );

  // Create CSV content
  const csvContent = [
    // Header row
    keys.join(','),
    // Data rows
    ...data.map((row) =>
      keys.map((key) => {
        const value = row[key];
        // Handle nested objects
        if (value && typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Escape commas and quotes
        const stringValue = value != null ? String(value) : '';
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true; // Return true to indicate success
};

export const importFromExcel = (
  file: File,
  onSuccess: (data: any[]) => void,
  onError: (error: string) => void
) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        onError('File must contain at least a header row and one data row');
        return;
      }

      // Parse CSV
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i++; // Skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      // Get headers
      const headers = parseCSVLine(lines[0]);

      // Parse data rows
      const data = lines.slice(1).map((line) => {
        const values = parseCSVLine(line);
        const obj: any = {};

        headers.forEach((header, index) => {
          let value = values[index] || '';

          // Try to parse JSON objects
          if (value.startsWith('{') || value.startsWith('[')) {
            try {
              obj[header] = JSON.parse(value);
            } catch {
              obj[header] = value;
            }
          } else if (!isNaN(Number(value)) && value !== '') {
            // Convert to number if applicable
            obj[header] = Number(value);
          } else {
            obj[header] = value;
          }
        });

        return obj;
      });

      onSuccess(data);
    } catch (error) {
      onError(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  reader.onerror = () => {
    onError('Error reading file');
  };

  reader.readAsText(file);
};

// Template generation for specific entity types
export const generateProjectTemplate = () => {
  const template = [
    {
      scenarioId: 1,
      projectNumber: 'DMND0000001',
      name: 'Sample Project',
      description: 'Project description',
      businessProcess: 'Business Process Name',
      functionality: 'Functionality description',
      segmentFunctionId: 1,
      domainId: 1,
      status: 'Planning',
      priority: 'Medium',
      businessDecision: 'Above Cut-Line',
      businessPriority: 'High',
      type: 'Project',
      fiscalYear: 'FY25',
      targetRelease: 'R1.0',
      targetSprint: 'Sprint 1',
      progress: 0,
      currentPhase: 'Requirements',
      budget: 100000,
      actualCost: 0,
      forecastedCost: 100000,
      plannedOpex: 100000,
      plannedCapex: 0,
      totalPlannedCost: 100000,
      financialBenefit: 0,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      desiredStartDate: '2025-01-01',
      desiredCompletionDate: '2025-12-31',
      actualStartDate: '',
      actualEndDate: '',
      deadline: '2025-12-31',
      healthStatus: 'Green',
      needleMover: '',
      dow: '',
      investmentClass: 'Operational Improvements (H1)',
      benefitArea: 'Productivity & Scale',
      technologyArea: 'PLM',
      enterpriseCategory: 'BU Strategic',
      projectInfrastructureNeeded: false,
      coCreation: false,
      technologyChoice: 'Existing Technology and Existing Application',
      segmentFunction: 'WWO',
      division: 'Engineering',
      newOrCarryOver: 'New',
      submittedById: 1,
      domainManagerId: 1,
      projectManagerId: 1,
      sponsorId: 1,
      rank: 0,
      sortOrder: 0,
      isActive: true,
    },
  ];
  exportToExcel(template, 'project_template');
};

export const generateResourceTemplate = () => {
  const template = [
    {
      employeeId: 'EMP001',
      userId: '',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      primarySkill: 'JavaScript',
      secondarySkills: 'React, Node.js, TypeScript',
      role: 'Developer',
      location: 'New York',
      timezone: 'America/New_York',
      hourlyRate: 100,
      monthlyCost: 16000,
      totalCapacityHours: 160,
      utilizationRate: 80,
      homeLocation: 'New York',
      isRemote: false,
      joiningDate: '2024-01-01',
      endOfServiceDate: '',
      isActive: true,
      domainId: 1,
      segmentFunctionId: 1,
    },
  ];
  exportToExcel(template, 'resource_template');
};

export const generateResourceCapabilityTemplate = () => {
  const template = [
    {
      resourceId: 1,
      appId: 1,
      technologyId: 1,
      roleId: 1,
      proficiencyLevel: 'Advanced',
      yearsOfExperience: 5,
      isPrimary: true,
      isActive: true,
    },
  ];
  exportToExcel(template, 'resource_capability_template');
};

export const generateProjectRequirementTemplate = () => {
  const template = [
    {
      projectId: 1,
      appId: 1,
      technologyId: 1,
      roleId: 1,
      proficiencyLevel: 'Intermediate',
      requiredCount: 2,
      minYearsExp: 3,
      isActive: true,
    },
  ];
  exportToExcel(template, 'project_requirement_template');
};

export const generateResourceAllocationTemplate = () => {
  const template = [
    {
      resourceId: 1,
      projectId: 1,
      scenarioId: 1,
      resourceCapabilityId: 1,
      projectRequirementId: 1,
      allocationPercentage: 100,
      allocationType: 'Shared',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      isActive: true,
    },
  ];
  exportToExcel(template, 'resource_allocation_template');
};

export const generateMilestoneTemplate = () => {
  const template = [
    {
      scenarioId: 1,
      projectId: 1,
      ownerId: 1,
      phase: 'Requirements',
      name: 'Milestone Name',
      description: 'Milestone description',
      plannedStartDate: '2025-01-01',
      plannedEndDate: '2025-03-31',
      actualStartDate: '',
      actualEndDate: '',
      status: 'Not Started',
      progress: 0,
      dependencies: '',
      deliverables: 'List of deliverables',
      healthStatus: 'Green',
      isActive: true,
    },
  ];
  exportToExcel(template, 'milestone_template');
};

export const generateScenarioTemplate = () => {
  const template = [
    {
      name: 'Scenario Name',
      description: 'Scenario description',
      status: 'planned',
      createdBy: 1,
      isActive: true,
    },
  ];
  exportToExcel(template, 'scenario_template');
};

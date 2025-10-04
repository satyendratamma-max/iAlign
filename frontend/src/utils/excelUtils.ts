// Excel Import/Export Utilities using native browser APIs (no external dependencies)

export const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
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
      projectNumber: 'DMND0000001',
      name: 'Sample Project',
      description: 'Project description',
      portfolioId: 1,
      domainId: 1,
      status: 'Planning',
      priority: 'Medium',
      businessDecision: 'Above Cut-Line',
      businessPriority: 'High',
      type: 'Project',
      fiscalYear: 'FY25',
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
    },
  ];
  exportToExcel(template, 'project_template');
};

export const generateResourceTemplate = () => {
  const template = [
    {
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      primarySkill: 'Dev',
      role: 'Developer',
      location: 'New York',
      hourlyRate: 100,
      monthlyCost: 16000,
      totalCapacityHours: 160,
      domainId: 1,
      portfolioId: 1,
      domainTeamId: 1,
    },
  ];
  exportToExcel(template, 'resource_template');
};

import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import scenarioApi, { Scenario } from '../services/scenarioApi';

interface ScenarioContextType {
  scenarios: Scenario[];
  activeScenario: Scenario | null;
  loading: boolean;
  error: string | null;
  setActiveScenario: (scenario: Scenario | null) => void;
  refreshScenarios: () => Promise<void>;
}

const ScenarioContext = createContext<ScenarioContextType>({
  scenarios: [],
  activeScenario: null,
  loading: false,
  error: null,
  setActiveScenario: () => {},
  refreshScenarios: async () => {},
});

export const useScenario = () => useContext(ScenarioContext);

interface ScenarioProviderProps {
  children: ReactNode;
}

export const ScenarioProvider = ({ children }: ScenarioProviderProps) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenario, setActiveScenarioState] = useState<Scenario | null>(() => {
    const savedScenarioId = localStorage.getItem('activeScenarioId');
    return savedScenarioId ? ({ id: parseInt(savedScenarioId) } as Scenario) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scenarioApi.getAll();
      setScenarios(data);

      // Check if we need to update or set an active scenario
      const savedScenarioId = localStorage.getItem('activeScenarioId');

      if (savedScenarioId) {
        // If there's a saved active scenario, update it with fresh data
        const updatedActiveScenario = data.find(s => s.id === parseInt(savedScenarioId));
        if (updatedActiveScenario) {
          setActiveScenarioState(updatedActiveScenario);
        } else {
          // If saved scenario no longer exists (deleted), clear it and set first published
          localStorage.removeItem('activeScenarioId');
          const publishedScenario = data.find(s => s.status === 'published');
          if (publishedScenario) {
            setActiveScenarioState(publishedScenario);
            localStorage.setItem('activeScenarioId', publishedScenario.id.toString());
          }
        }
      } else if (data.length > 0) {
        // If no active scenario is set and there are scenarios, set the first published one as active
        const publishedScenario = data.find(s => s.status === 'published');
        if (publishedScenario) {
          setActiveScenarioState(publishedScenario);
          localStorage.setItem('activeScenarioId', publishedScenario.id.toString());
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load scenarios');
      console.error('Error loading scenarios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const setActiveScenario = useCallback((scenario: Scenario | null) => {
    setActiveScenarioState(scenario);
    if (scenario) {
      localStorage.setItem('activeScenarioId', scenario.id.toString());
    } else {
      localStorage.removeItem('activeScenarioId');
    }
  }, []);

  // Load scenarios on mount
  useEffect(() => {
    refreshScenarios();
  }, []);

  const value = {
    scenarios,
    activeScenario,
    loading,
    error,
    setActiveScenario,
    refreshScenarios,
  };

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
};

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react';

type CompetitorSelectionContextValue = {
  selectedCompetitor: string;
  setSelectedCompetitor: Dispatch<SetStateAction<string>>;
};

type CompetitorSelectionActions = {
  setSelectedCompetitor: Dispatch<SetStateAction<string>>;
  getSelectedCompetitor: () => string;
};

const CompetitorSelectionContext = createContext<CompetitorSelectionContextValue | null>(null);
const CompetitorSelectionActionsContext = createContext<CompetitorSelectionActions | null>(null);

export function CompetitorSelectionProvider({ children }: PropsWithChildren) {
  const [selectedCompetitor, setSelectedCompetitor] = useState('');
  const selectedCompetitorRef = useRef(selectedCompetitor);
  selectedCompetitorRef.current = selectedCompetitor;
  const state = useMemo(() => ({ selectedCompetitor, setSelectedCompetitor }), [selectedCompetitor]);
  const getSelectedCompetitor = useCallback(() => selectedCompetitorRef.current, []);
  const actions = useMemo(
    () => ({ setSelectedCompetitor, getSelectedCompetitor }),
    [getSelectedCompetitor],
  );

  return (
    <CompetitorSelectionActionsContext.Provider value={actions}>
      <CompetitorSelectionContext.Provider value={state}>
        {children}
      </CompetitorSelectionContext.Provider>
    </CompetitorSelectionActionsContext.Provider>
  );
}

export function useCompetitorSelection() {
  const context = useContext(CompetitorSelectionContext);
  if (!context) throw new Error('useCompetitorSelection debe usarse dentro de CompetitorSelectionProvider.');
  return context;
}

export function useCompetitorSelectionActions() {
  const context = useContext(CompetitorSelectionActionsContext);
  if (!context) throw new Error('useCompetitorSelectionActions debe usarse dentro de CompetitorSelectionProvider.');
  return context;
}

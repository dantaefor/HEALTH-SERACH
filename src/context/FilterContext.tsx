import { createContext, useContext, useState, ReactNode } from "react";

interface FilterContextType {
  selectedCompany: string | null; // e.g., "A", "B", etc.
  setSelectedCompany: (company: string | null) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const clearFilters = () => {
    setSelectedCompany(null);
  };

  return (
    <FilterContext.Provider value={{ selectedCompany, setSelectedCompany, clearFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}

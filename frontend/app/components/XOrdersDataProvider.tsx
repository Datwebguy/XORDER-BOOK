"use client";

import { createContext, useContext } from "react";
import { useXOrdersEvents } from "../lib/hooks";

type XOrdersData = ReturnType<typeof useXOrdersEvents>;

const XOrdersDataContext = createContext<XOrdersData | null>(null);

export function XOrdersDataProvider({ children }: { children: React.ReactNode }) {
  const data = useXOrdersEvents();
  return <XOrdersDataContext.Provider value={data}>{children}</XOrdersDataContext.Provider>;
}

export function useXOrdersData() {
  const data = useContext(XOrdersDataContext);
  if (!data) throw new Error("useXOrdersData must be used inside XOrdersDataProvider");
  return data;
}

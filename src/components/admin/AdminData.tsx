"use client";
import { createContext, useContext } from "react";

/** Small shared lookups for admin forms (page list for link pickers). */
export type AdminData = { pages: { id: string; title: string; slug: string }[] };
const Ctx = createContext<AdminData>({ pages: [] });
export const useAdminData = () => useContext(Ctx);
export function AdminDataProvider({ value, children }: { value: AdminData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

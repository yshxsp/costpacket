import type { Workspace } from "./workspace";
export const TRIAL_DAYS = 14;
export type CompanyAccess = Awaited<ReturnType<Workspace["access"]>>;
export async function getCompanyAccess(ws: Workspace) {
  return ws.access();
}

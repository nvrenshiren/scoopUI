import { create } from 'zustand';

export interface PackageDialogMeta {
  installed?: boolean;
  outdated?: boolean;
  latestVersion?: string;
  conflict?: string;
}

interface PackageDialogState {
  openPackageId: string | null;
  meta: PackageDialogMeta;
  openDialog: (id: string, meta?: PackageDialogMeta) => void;
  closeDialog: () => void;
  setMeta: (meta: PackageDialogMeta) => void;
}

export const usePackageDialogStore = create<PackageDialogState>()((set) => ({
  openPackageId: null,
  meta: {},
  openDialog: (id, meta = {}) => set({ openPackageId: id, meta: { ...meta } }),
  closeDialog: () => set({ openPackageId: null, meta: {} }),
  setMeta: (meta) => set({ meta: { ...meta } }),
}));

export function selectIsOpen(s: PackageDialogState): boolean {
  return s.openPackageId !== null;
}
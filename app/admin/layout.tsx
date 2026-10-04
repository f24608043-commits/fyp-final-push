// The root layout already mounts the single role-aware Shell, so this
// layout only needs to pass children through. Kept for route-group clarity.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

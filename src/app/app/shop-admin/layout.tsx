import { PortalSidebar } from "@/components/portal-sidebar";
import { RoleGuard } from "@/components/role-guard";

export default function ShopAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <PortalSidebar portalRole="SHOP_STAFF" />
      <div className="flex-1 overflow-x-hidden p-6 bg-slate-50 dark:bg-slate-950">
        <RoleGuard allowedRoles={["OWNER", "MANAGER", "SHOP_STAFF"]}>{children}</RoleGuard>
      </div>
    </div>
  );
}

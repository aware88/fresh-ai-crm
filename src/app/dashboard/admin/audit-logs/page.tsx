import { Metadata } from 'next';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Audit Logs | CRM Mind',
  description: 'View and search security audit logs for system activities',
};

export default function AuditLogsPage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          View and search security audit logs for compliance and security monitoring.
        </p>
      </div>
      
      <AuditLogViewer />
    </div>
  );
}

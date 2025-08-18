import EmailLearningSettings from '@/components/email/EmailLearningSettings';
import EmailDraftTest from '@/components/email/EmailDraftTest';
import PatternManagement from '@/components/email/PatternManagement';
import LearningAnalytics from '@/components/email/LearningAnalytics';
import QualityDashboard from '@/components/email/QualityDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LearningSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Learning</h1>
        <p className="text-gray-600 mt-1">
          Configure how AI learns from your email communication patterns to provide better responses.
        </p>
      </div>
      
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="settings">Learning Settings</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="quality">Quality Assurance</TabsTrigger>
          <TabsTrigger value="test">Draft Testing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="mt-6">
          <EmailLearningSettings />
        </TabsContent>
        
        <TabsContent value="patterns" className="mt-6">
          <PatternManagement />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <LearningAnalytics />
        </TabsContent>
        
        <TabsContent value="quality" className="mt-6">
          <QualityDashboard />
        </TabsContent>
        
        <TabsContent value="test" className="mt-6">
          <EmailDraftTest />
        </TabsContent>
      </Tabs>
    </div>
  );
} 
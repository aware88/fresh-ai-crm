import { EmailAnalyzer } from "@/components/email/EmailAnalyzer";

export default function EmailAnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Analysis</h1>
        <p className="text-muted-foreground">
          Analyze emails to extract insights and action items
        </p>
      </div>
      
      <EmailAnalyzer />
    </div>
  );
}

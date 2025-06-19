import EmailAnalyserClient from "@/app/dashboard/email-analyser/EmailAnalyserClient";

export default function EmailAnalyserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Analyser</h1>
        <p className="text-muted-foreground">
          Automatically fetch, analyze, and manage your emails
        </p>
      </div>
      
      <EmailAnalyserClient />
    </div>
  );
}

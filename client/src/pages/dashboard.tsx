import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsGrid from "@/components/stats-grid";
import ReceiptUpload from "@/components/receipt-upload";
import AIInsights from "@/components/ai-insights";
import FraudDetection from "@/components/fraud-detection";
import ResponseTemplates from "@/components/response-templates";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <Header 
          title="Dashboard" 
          subtitle="Monitor your business with AI-powered insights" 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <StatsGrid />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ReceiptUpload />
            <AIInsights />
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FraudDetection />
            <ResponseTemplates />
          </div>
        </main>
      </div>
    </div>
  );
}

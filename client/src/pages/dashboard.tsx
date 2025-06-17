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
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard" 
          subtitle="Monitor your business with AI-powered insights" 
        />
        
        <main className="flex-1 overflow-auto p-6 space-y-8">
          <StatsGrid />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ReceiptUpload />
            </div>
            <div className="lg:col-span-2">
              <AIInsights />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FraudDetection />
            <ResponseTemplates />
          </div>
        </main>
      </div>
    </div>
  );
}

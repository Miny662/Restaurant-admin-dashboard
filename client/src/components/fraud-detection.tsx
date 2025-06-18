import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Search, CheckCircle } from "lucide-react";
import { parseJsonArray } from "@/lib/utils";
import type { Receipt } from "@shared/schema";

export default function FraudDetection() {
  const { data: receipts } = useQuery<Receipt[]>({
    queryKey: ['/api/receipts'],
  });

  const flaggedReceipts = receipts?.filter(r => r.status === 'flagged' || parseJsonArray(r.fraudFlags).length > 0) || [];
  const riskLevels = flaggedReceipts.map(receipt => {
    const trustScore = receipt.trustScore || 0;
    if (trustScore < 0.5) return 'High';
    if (trustScore < 0.8) return 'Medium';
    return 'Low';
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'border-red-200 bg-red-50';
      case 'Medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-green-200 bg-green-50';
    }
  };

  const getRiskTextColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'High': return AlertTriangle;
      case 'Medium': return Search;
      default: return CheckCircle;
    }
  };

  const getIssueDescription = (fraudFlags: string[]) => {
    if (fraudFlags.includes('duplicate_receipt')) return 'Potential duplicate detected';
    if (fraudFlags.includes('unusual_amount_pattern')) return 'Unusual amount pattern';
    if (fraudFlags.includes('poor_image_quality')) return 'Poor image quality';
    if (fraudFlags.includes('missing_critical_info')) return 'Missing critical information';
    return 'All checks passed';
  };

  return (
    <Card className="border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-lg font-semibold text-gray-900">Fraud Detection</CardTitle>
        <p className="text-gray-600 mt-1">AI-powered receipt verification results</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {receipts && receipts.length > 0 ? (
            receipts.slice(0, 3).map((receipt, index) => {
              const risk = receipt.trustScore && receipt.trustScore < 0.5 ? 'High' : 
                          receipt.trustScore && receipt.trustScore < 0.8 ? 'Medium' : 'Low';
              const RiskIcon = getRiskIcon(risk);
              
              return (
                <div 
                  key={receipt.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg ${getRiskColor(risk)}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      risk === 'High' ? 'bg-red-100' : 
                      risk === 'Medium' ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      <RiskIcon className={getRiskTextColor(risk) + ' w-5 h-5'} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Receipt #{receipt.id.toString().padStart(4, '0')}</p>
                      <p className="text-sm text-gray-600">
                        {getIssueDescription(parseJsonArray(receipt.fraudFlags))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getRiskTextColor(risk)}`}>Risk: {risk}</p>
                    <p className="text-xs text-gray-500">
                      Confidence: {Math.round((receipt.confidence || 0) * 100)}%
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-8">No receipts to analyze</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

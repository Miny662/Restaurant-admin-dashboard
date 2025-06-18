import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ReceiptUpload from "@/components/receipt-upload";
import FraudDetection from "@/components/fraud-detection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime, getTrustScoreBadgeColor, parseJsonArray } from "@/lib/utils";
import type { Receipt } from "@shared/schema";

export default function ReceiptAnalysis() {
  const { data: receipts, isLoading } = useQuery<Receipt[]>({
    queryKey: ['/api/receipts'],
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <Header 
          title="Receipt Analysis" 
          subtitle="AI-powered receipt verification and fraud detection" 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <ReceiptUpload />
            <div>
              <FraudDetection />
            </div>
          </div>

          {/* All Receipts */}
          <Card className="border border-gray-100">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900">All Receipts</CardTitle>
              <p className="text-gray-600 mt-1">Complete history of analyzed receipts</p>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : receipts && receipts.length > 0 ? (
                <div className="space-y-4">
                  {receipts.map((receipt) => (
                    <div key={receipt.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${
                            receipt.status === 'verified' ? 'bg-green-500' : 
                            receipt.status === 'flagged' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}>
                            #{receipt.id}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {receipt.merchantName || 'Unknown Merchant'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {receipt.amount ? formatCurrency(receipt.amount) : 'Amount not detected'} • {formatDateTime(receipt.createdAt!)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTrustScoreBadgeColor(receipt.trustScore || 0)}>
                            Trust: {Math.round((receipt.trustScore || 0) * 100)}%
                          </Badge>
                          <Badge variant="outline" className={
                            receipt.status === 'verified' ? 'border-green-200 text-green-700' :
                            receipt.status === 'flagged' ? 'border-red-200 text-red-700' :
                            'border-yellow-200 text-yellow-700'
                          }>
                            {receipt.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {parseJsonArray(receipt.items).length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
                          <div className="flex flex-wrap gap-1">
                            {parseJsonArray(receipt.items).map((item, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {parseJsonArray(receipt.fraudFlags).length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-700 mb-1">Fraud Flags:</p>
                          <div className="flex flex-wrap gap-1">
                            {parseJsonArray(receipt.fraudFlags).map((flag, index) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {flag.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">
                  No receipts uploaded yet. Start by uploading your first receipt above.
                </p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

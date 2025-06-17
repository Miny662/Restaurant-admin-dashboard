import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CloudUpload, Folder, Camera, Check, AlertTriangle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatRelativeTime, getTrustScoreBadgeColor } from "@/lib/utils";
import type { Receipt } from "@shared/schema";

export default function ReceiptUpload() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: receipts, isLoading } = useQuery<Receipt[]>({
    queryKey: ['/api/receipts'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('receipt', file);
      
      const response = await apiRequest('POST', '/api/receipts', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      toast({
        title: "Receipt uploaded successfully",
        description: "AI analysis completed",
      });
      setUploading(false);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploading(true);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    multiple: false,
  });

  const handleCameraCapture = () => {
    // Create a file input for camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setUploading(true);
        uploadMutation.mutate(file);
      }
    };
    input.click();
  };

  return (
    <div className="lg:col-span-2">
      <Card className="border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Receipt Analysis</CardTitle>
          <p className="text-gray-600 mt-1">Upload receipts for AI-powered verification and fraud detection</p>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
            } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CloudUpload className="text-blue-600 w-8 h-8" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {uploading ? 'Processing Receipt...' : 'Upload Receipt'}
            </h4>
            <p className="text-gray-600 mb-4">
              {uploading 
                ? 'AI is analyzing your receipt for authenticity and extracting data'
                : 'Drag and drop your receipt or click to browse'
              }
            </p>
            {!uploading && (
              <div className="flex items-center justify-center space-x-4">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Folder className="mr-2 w-4 h-4" />
                  Browse Files
                </Button>
                <Button 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCameraCapture();
                  }}
                >
                  <Camera className="mr-2 w-4 h-4" />
                  Take Photo
                </Button>
              </div>
            )}
          </div>

          {/* Recent Analysis Results */}
          <div className="mt-8">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Analysis</h4>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : receipts && receipts.length > 0 ? (
              <div className="space-y-4">
                {receipts.slice(0, 3).map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        receipt.status === 'verified' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        {receipt.status === 'verified' ? (
                          <Check className="text-green-600 w-6 h-6" />
                        ) : (
                          <AlertTriangle className="text-yellow-600 w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{receipt.merchantName || 'Unknown Merchant'}</p>
                        <p className="text-sm text-gray-600">
                          {receipt.amount ? formatCurrency(receipt.amount) : 'Unknown amount'} • {formatRelativeTime(receipt.createdAt!)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getTrustScoreBadgeColor(receipt.trustScore || 0)}>
                        <Shield className="mr-1 w-3 h-3" />
                        {receipt.status === 'verified' ? 'Verified' : 'Review Required'} {Math.round((receipt.trustScore || 0) * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No receipts uploaded yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

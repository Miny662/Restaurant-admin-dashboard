import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CloudUpload, 
  Folder, 
  Camera, 
  Check, 
  AlertTriangle, 
  Shield, 
  Star, 
  Bot, 
  TrendingUp,
  Eye,
  Clock,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatRelativeTime, getTrustScoreBadgeColor, parseJsonArray } from "@/lib/utils";
import type { Receipt, Review } from "@shared/schema";
import { useLocation } from "wouter";

export default function UserDashboard() {
  const [uploading, setUploading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'upload' | 'analyzing' | 'complete'>('upload');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: receipts, isLoading: receiptsLoading } = useQuery<Receipt[]>({
    queryKey: ['/api/receipts'],
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ['/api/reviews'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('receipt', file);
      
      const response = await apiRequest('POST', '/api/receipts', formData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      toast({
        title: "Receipt analyzed successfully!",
        description: `Trust score: ${Math.round((data.trustScore || 0) * 100)}%`,
      });
      setUploading(false);
      setAnalysisStep('complete');
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
      setAnalysisStep('upload');
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/reviews', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      toast({
        title: "Review submitted successfully",
        description: "AI has analyzed your review and generated a response",
      });
      setIsReviewDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploading(true);
      setAnalysisStep('analyzing');
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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setUploading(true);
        setAnalysisStep('analyzing');
        uploadMutation.mutate(file);
      }
    };
    input.click();
  };

  const handleSubmitReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      customerName: formData.get('customerName') as string,
      rating: parseInt(formData.get('rating') as string),
      content: formData.get('content') as string,
    };
    createReviewMutation.mutate(data);
  };

  const getTrustScoreExplanation = (score: number) => {
    if (score >= 0.9) return "Excellent - Receipt appears authentic with high confidence";
    if (score >= 0.7) return "Good - Receipt likely authentic with minor concerns";
    if (score >= 0.5) return "Fair - Receipt has some suspicious elements";
    return "Poor - Receipt shows multiple fraud indicators";
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 0.9) return "text-green-600";
    if (score >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  const averageTrustScore = receipts && receipts.length > 0 
    ? receipts.reduce((sum, r) => sum + (r.trustScore || 0), 0) / receipts.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-8">
            <div></div>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Restaurant Trust Platform
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Upload receipts for AI-powered verification, submit reviews, and build trust with our community
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin')}
              className="bg-white hover:bg-gray-50"
            >
              Admin Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Upload Section */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="text-2xl font-bold">Receipt Verification</CardTitle>
                <p className="text-blue-100">AI-powered authenticity analysis</p>
              </CardHeader>
              
              <CardContent className="p-8">
                {analysisStep === 'upload' && (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                      isDragActive 
                        ? 'border-blue-500 bg-blue-50 scale-105' 
                        : 'border-gray-300 hover:border-blue-400 hover:scale-102'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CloudUpload className="text-blue-600 w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                      Upload Your Receipt
                    </h3>
                    <p className="text-gray-600 mb-8 text-lg">
                      Drag and drop your receipt or click to browse. Our AI will analyze it for authenticity.
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                      <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                        <Folder className="mr-2 w-5 h-5" />
                        Browse Files
                      </Button>
                      <Button 
                        size="lg"
                        variant="outline" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCameraCapture();
                        }}
                      >
                        <Camera className="mr-2 w-5 h-5" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                )}

                {analysisStep === 'analyzing' && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Bot className="text-blue-600 w-10 h-10 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                      AI Analysis in Progress
                    </h3>
                    <p className="text-gray-600 mb-8">
                      Our AI is analyzing your receipt for authenticity and extracting key information...
                    </p>
                    <div className="max-w-md mx-auto">
                      <Progress value={uploading ? 75 : 0} className="mb-4" />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Image Processing</span>
                        <span>Data Extraction</span>
                        <span>Fraud Detection</span>
                      </div>
                    </div>
                  </div>
                )}

                {analysisStep === 'complete' && receipts && receipts.length > 0 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="text-green-600 w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Analysis Complete!
                      </h3>
                      <p className="text-gray-600">
                        Your receipt has been analyzed. View the results below.
                      </p>
                    </div>

                    {receipts.slice(0, 3).map((receipt) => (
                      <div key={receipt.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                        <div className="flex items-center justify-between mb-4">
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
                              <h4 className="font-semibold text-gray-900">
                                {receipt.merchantName || 'Unknown Merchant'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {receipt.amount ? formatCurrency(receipt.amount) : 'Amount not detected'} • {formatRelativeTime(receipt.createdAt!)}
                              </p>
                            </div>
                          </div>
                          <Badge className={getTrustScoreBadgeColor(receipt.trustScore || 0)}>
                            <Shield className="mr-1 w-3 h-3" />
                            {Math.round((receipt.trustScore || 0) * 100)}% Trust
                          </Badge>
                        </div>

                        {/* Trust Score Explanation */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">Trust Score Breakdown</span>
                            <span className={`font-semibold ${getTrustScoreColor(receipt.trustScore || 0)}`}>
                              {Math.round((receipt.trustScore || 0) * 100)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            {getTrustScoreExplanation(receipt.trustScore || 0)}
                          </p>
                          
                          {/* Detailed Trust Factors */}
                          {receipt.trustFactors && (
                            <div className="space-y-3">
                              <h6 className="text-sm font-medium text-gray-700">Detailed Analysis:</h6>
                              {Object.entries(JSON.parse(receipt.trustFactors || '{}')).map(([factor, score]) => {
                                const factorName = factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                const factorScore = score as number;
                                const getFactorColor = (score: number) => {
                                  if (score >= 0.9) return "text-green-600";
                                  if (score >= 0.7) return "text-yellow-600";
                                  return "text-red-600";
                                };
                                const getFactorIcon = (score: number) => {
                                  if (score >= 0.9) return "✓";
                                  if (score >= 0.7) return "⚠";
                                  return "✗";
                                };
                                
                                return (
                                  <div key={factor} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">{factorName}</span>
                                    <div className="flex items-center space-x-2">
                                      <span className={`font-medium ${getFactorColor(factorScore)}`}>
                                        {Math.round(factorScore * 100)}%
                                      </span>
                                      <span className={`text-lg ${getFactorColor(factorScore)}`}>
                                        {getFactorIcon(factorScore)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Fraud Flags */}
                        {parseJsonArray(receipt.fraudFlags).length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h5 className="font-medium text-red-900 mb-2">Fraud Indicators Detected:</h5>
                            <div className="flex flex-wrap gap-2">
                              {parseJsonArray(receipt.fraudFlags).map((flag, index) => (
                                <Badge key={index} variant="destructive" className="text-xs">
                                  {flag.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Items */}
                        {parseJsonArray(receipt.items).length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Detected Items:</h5>
                            <div className="flex flex-wrap gap-2">
                              {parseJsonArray(receipt.items).map((item, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <Button 
                      onClick={() => setAnalysisStep('upload')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <CloudUpload className="mr-2 w-4 h-4" />
                      Upload Another Receipt
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trust Score Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 w-5 h-5" />
                  Trust Score
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {Math.round(averageTrustScore * 100)}%
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Average trust score across all receipts
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${averageTrustScore * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {receipts?.length || 0} receipts analyzed
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Submission */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="flex items-center">
                  <Star className="mr-2 w-5 h-5" />
                  Submit Review
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Share your experience and help build our community trust
                </p>
                <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <Star className="mr-2 w-4 h-4" />
                      Write a Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Submit Your Review</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <Label htmlFor="customerName">Your Name</Label>
                        <Input id="customerName" name="customerName" required />
                      </div>
                      <div>
                        <Label htmlFor="rating">Rating</Label>
                        <Select name="rating" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">⭐⭐⭐⭐⭐ Excellent</SelectItem>
                            <SelectItem value="4">⭐⭐⭐⭐ Very Good</SelectItem>
                            <SelectItem value="3">⭐⭐⭐ Good</SelectItem>
                            <SelectItem value="2">⭐⭐ Fair</SelectItem>
                            <SelectItem value="1">⭐ Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="content">Your Review</Label>
                        <Textarea 
                          id="content" 
                          name="content" 
                          rows={4}
                          placeholder="Share your experience..."
                          required 
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsReviewDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createReviewMutation.isPending}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2 w-5 h-5" />
                  Recent Reviews
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {reviewsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="border-l-4 border-purple-200 pl-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {review.customerName}
                          </span>
                          <div className="flex text-yellow-400 text-xs">
                            {'★'.repeat(review.rating)}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {review.content}
                        </p>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(review.createdAt!)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No reviews yet. Be the first to share your experience!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 
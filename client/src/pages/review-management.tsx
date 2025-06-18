import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Star, Plus, MessageSquare, Clock, CheckCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatRelativeTime, getRatingStars, parseBoolean } from "@/lib/utils";
import type { Review } from "@shared/schema";

export default function ReviewManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [replyDialog, setReplyDialog] = useState<{ isOpen: boolean; review: Review | null }>({
    isOpen: false,
    review: null,
  });
  const [customReply, setCustomReply] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['/api/reviews'],
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/reviews', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      toast({
        title: "Review added successfully",
        description: "AI has analyzed the review and generated a suggested reply",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, useAiReply, customReply }: { 
      reviewId: number; 
      useAiReply: boolean; 
      customReply?: string; 
    }) => {
      const response = await apiRequest('PATCH', `/api/reviews/${reviewId}/reply`, { 
        useAiReply, 
        ...(customReply && { customReply })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      toast({
        title: "Reply posted successfully",
        description: "Your response has been published",
      });
      setReplyDialog({ isOpen: false, review: null });
      setCustomReply("");
    },
    onError: (error) => {
      toast({
        title: "Failed to post reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      customerName: formData.get('customerName') as string,
      rating: parseInt(formData.get('rating') as string),
      content: formData.get('content') as string,
    };
    createReviewMutation.mutate(data);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const reviewsNeedingReply = reviews?.filter(r => !parseBoolean(r.hasReplied)) || [];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <Header 
          title="Review Management" 
          subtitle="AI-powered review insights and response suggestions" 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                    <p className="text-3xl font-bold text-gray-900">{reviews?.length || 0}</p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Need Reply</p>
                    <p className="text-3xl font-bold text-gray-900">{reviewsNeedingReply.length}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {reviews && reviews.length > 0 
                        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                        : '0.0'
                      }
                    </p>
                  </div>
                  <div className="text-yellow-500 text-2xl">
                    {reviews && reviews.length > 0 
                      ? getRatingStars(Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length))
                      : '☆☆☆☆☆'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reviews List */}
          <Card className="border border-gray-100">
            <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">All Reviews</CardTitle>
                <p className="text-gray-600 mt-1">Manage customer feedback and responses</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 w-4 h-4" />
                    Add Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Review</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateReview} className="space-y-4">
                    <div>
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input id="customerName" name="customerName" required />
                    </div>
                    <div>
                      <Label htmlFor="rating">Rating</Label>
                      <Select name="rating" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Stars</SelectItem>
                          <SelectItem value="4">4 Stars</SelectItem>
                          <SelectItem value="3">3 Stars</SelectItem>
                          <SelectItem value="2">2 Stars</SelectItem>
                          <SelectItem value="1">1 Star</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="content">Review Content</Label>
                      <Textarea 
                        id="content" 
                        name="content" 
                        rows={4}
                        placeholder="Enter the review text..."
                        required 
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createReviewMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createReviewMutation.isPending ? 'Adding...' : 'Add Review'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : reviews && reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex text-yellow-500">
                            {getRatingStars(review.rating)}
                          </div>
                          <span className="font-medium text-gray-900">{review.customerName}</span>
                          {review.sentiment && (
                            <Badge className={getSentimentColor(review.sentiment)}>
                              {review.sentiment}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{formatRelativeTime(review.createdAt!)}</span>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{review.content}</p>
                      
                      {review.aiReply && (
                        <div className={`rounded-lg p-4 mb-4 ${
                          parseBoolean(review.hasReplied) ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
                        }`}>
                          <div className="flex items-center mb-2">
                            {parseBoolean(review.hasReplied) ? (
                              <Badge className="bg-green-100 text-green-700">
                                <Star className="mr-1 w-3 h-3" />
                                Published Reply
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-700">
                                <Bot className="mr-1 w-3 h-3" />
                                AI Suggested Reply
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700">{review.aiReply}</p>
                        </div>
                      )}
                      
                      {!parseBoolean(review.hasReplied) && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => replyMutation.mutate({ reviewId: review.id, useAiReply: true })}
                            disabled={replyMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {replyMutation.isPending ? 'Posting...' : 'Use AI Reply'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReplyDialog({ isOpen: true, review });
                              setCustomReply(review.aiReply || '');
                            }}
                          >
                            Customize Reply
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">
                  No reviews yet. Add your first review to get started with AI-powered response suggestions.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Custom Reply Dialog */}
          <Dialog 
            open={replyDialog.isOpen} 
            onOpenChange={(open) => {
              setReplyDialog({ isOpen: open, review: replyDialog.review });
              if (!open) setCustomReply("");
            }}
          >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Customize Reply</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customReply">Your Reply</Label>
                  <Textarea
                    id="customReply"
                    value={customReply}
                    onChange={(e) => setCustomReply(e.target.value)}
                    rows={4}
                    placeholder="Write your custom reply..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setReplyDialog({ isOpen: false, review: null })}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (replyDialog.review) {
                        replyMutation.mutate({
                          reviewId: replyDialog.review.id,
                          useAiReply: false,
                          customReply,
                        });
                      }
                    }}
                    disabled={replyMutation.isPending || !customReply.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {replyMutation.isPending ? 'Posting...' : 'Post Reply'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

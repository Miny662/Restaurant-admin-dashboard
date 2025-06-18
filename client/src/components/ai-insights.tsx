import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Star, ArrowRight, Calendar, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatRelativeTime, getRatingStars, parseBoolean } from "@/lib/utils";
import type { Review, Reservation } from "@shared/schema";

interface WeeklySummary {
  summary: string;
  positiveHighlights: string[];
  areasForImprovement: string[];
}

export default function AIInsights() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: weeklySummary } = useQuery<WeeklySummary>({
    queryKey: ['/api/analytics/weekly-summary'],
  });

  const { data: reviews } = useQuery<Review[]>({
    queryKey: ['/api/reviews'],
  });

  const { data: todayReservations } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations/today'],
  });

  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, useAiReply }: { reviewId: number; useAiReply: boolean }) => {
      const response = await apiRequest('PATCH', `/api/reviews/${reviewId}/reply`, { useAiReply });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      toast({
        title: "Reply posted successfully",
        description: "Your response has been published",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to post reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reviewsNeedingReply = reviews?.filter(r => !parseBoolean(r.hasReplied)) || [];

  return (
    <div className="space-y-6 max-h-[800px] overflow-y-auto">
      {/* Weekly Summary */}
      <Card className="border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Weekly AI Summary</CardTitle>
          <p className="text-gray-600 mt-1">AI-generated insights from this week</p>
        </CardHeader>
        <CardContent className="p-6">
          {weeklySummary ? (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="text-blue-600 w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {weeklySummary.summary}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse bg-gray-200 rounded-lg h-20"></div>
          )}
          <Button variant="link" className="p-0 text-blue-600 hover:text-blue-700">
            View Full Report <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Review Management */}
      <Card className="border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Reviews</CardTitle>
            {reviewsNeedingReply.length > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                {reviewsNeedingReply.length} Need Reply
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {reviews && reviews.length > 0 ? (
            reviews.slice(0, 2).map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex text-yellow-500 text-sm">
                      {getRatingStars(review.rating)}
                    </div>
                    <span className="text-sm text-gray-600">{review.customerName}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatRelativeTime(review.createdAt!)}</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{review.content}</p>
                
                {review.aiReply && (
                  <div className={`rounded-lg p-3 mb-3 ${
                    parseBoolean(review.hasReplied) ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    <p className={`text-xs mb-1 ${
                      parseBoolean(review.hasReplied) ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {parseBoolean(review.hasReplied) ? (
                        <>
                          <Star className="inline w-3 h-3 mr-1" />
                          Replied {formatRelativeTime(review.createdAt!)}
                        </>
                      ) : (
                        <>
                          <Bot className="inline w-3 h-3 mr-1" />
                          AI Suggested Reply:
                        </>
                      )}
                    </p>
                    <p className="text-sm text-gray-700">{review.aiReply}</p>
                  </div>
                )}
                
                {!parseBoolean(review.hasReplied) && (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => replyMutation.mutate({ reviewId: review.id, useAiReply: true })}
                      disabled={replyMutation.isPending}
                    >
                      {replyMutation.isPending ? 'Posting...' : 'Use AI Reply'}
                    </Button>
                    <Button size="sm" variant="outline">
                      Customize
                    </Button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No reviews yet</p>
          )}

          <Button variant="link" className="w-full text-blue-600 hover:text-blue-700">
            View All Reviews <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Reservation Status */}
      <Card className="border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Today's Reservations</CardTitle>
          <p className="text-gray-600 mt-1">
            {todayReservations?.length || 0} bookings scheduled
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {todayReservations && todayReservations.length > 0 ? (
              todayReservations.slice(0, 3).map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{reservation.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {reservation.time} • Table for {reservation.partySize}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {parseBoolean(reservation.isVip) && (
                      <Badge className="bg-blue-100 text-blue-700">
                        VIP Guest
                      </Badge>
                    )}
                    {(reservation.noShowCount ?? 0) > 0 && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Flag className="mr-1 w-3 h-3" />
                        Previous No-Show
                      </Badge>
                    )}
                    {!parseBoolean(reservation.isVip) && (reservation.noShowCount ?? 0) === 0 && (
                      <Badge className="bg-green-100 text-green-700">
                        Confirmed
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No reservations today</p>
            )}
          </div>

          <Button variant="link" className="w-full mt-4 text-blue-600 hover:text-blue-700">
            View All Reservations <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

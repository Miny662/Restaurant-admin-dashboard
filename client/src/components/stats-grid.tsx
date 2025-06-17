import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Shield, Star, Calendar, TrendingUp } from "lucide-react";

interface DashboardStats {
  receiptsProcessed: number;
  trustScore: number;
  averageReviewScore: number;
  totalReviews: number;
  todayReservations: number;
  reviewsLastWeek: number;
}

export default function StatsGrid() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: "Receipts Processed",
      value: stats.receiptsProcessed.toLocaleString(),
      change: "+12% from last week",
      icon: Receipt,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      changeColor: "text-green-600",
    },
    {
      title: "Trust Score",
      value: `${(stats.trustScore * 100).toFixed(1)}%`,
      change: "Excellent security",
      icon: Shield,
      iconColor: "text-green-600", 
      iconBg: "bg-green-100",
      changeColor: "text-green-600",
    },
    {
      title: "Review Score",
      value: stats.averageReviewScore.toFixed(1),
      change: `Based on ${stats.totalReviews} reviews`,
      icon: Star,
      iconColor: "text-yellow-600",
      iconBg: "bg-yellow-100",
      changeColor: "text-green-600",
    },
    {
      title: "Reservations",
      value: stats.todayReservations.toString(),
      change: "Today",
      icon: Calendar,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100", 
      changeColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border border-gray-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <p className={`text-sm mt-1 ${card.changeColor}`}>
                    <TrendingUp className="inline w-4 h-4 mr-1" />
                    {card.change}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.iconColor} w-6 h-6`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Users, Phone, Mail, Plus, Flag, Crown, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDateTime, formatDate, getStatusColor, parseBoolean } from "@/lib/utils";
import type { Reservation } from "@shared/schema";

export default function Reservations() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations'],
  });

  const { data: todayReservations } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations/today'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/reservations', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations/today'] });
      toast({
        title: "Reservation created successfully",
        description: data.confirmationMessage || "Booking confirmed",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create reservation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/reservations/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations/today'] });
      toast({
        title: "Reservation updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update reservation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateReservation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const dateValue = formData.get('date') as string;
    const timeValue = formData.get('time') as string;
    
    const data = {
      customerName: formData.get('customerName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      partySize: parseInt(formData.get('partySize') as string),
      date: new Date(dateValue),
      time: timeValue,
      specialRequests: formData.get('specialRequests') as string || null,
      isVip: formData.get('isVip') === 'on',
    };
    
    createMutation.mutate(data);
  };

  const handleStatusUpdate = (reservationId: number, newStatus: string) => {
    const updates = { status: newStatus };
    if (newStatus === 'no-show') {
      const reservation = reservations?.find(r => r.id === reservationId);
      if (reservation) {
        updates.noShowCount = (reservation.noShowCount || 0) + 1;
      }
    }
    updateMutation.mutate({ id: reservationId, updates });
  };

  const filteredReservations = reservations?.filter(reservation => {
    if (filterStatus === "all") return true;
    return reservation.status === filterStatus;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'no-show':
        return <AlertTriangle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const stats = {
    total: reservations?.length || 0,
    today: todayReservations?.length || 0,
    confirmed: reservations?.filter(r => r.status === 'confirmed').length || 0,
    completed: reservations?.filter(r => r.status === 'completed').length || 0,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <Header 
          title="Reservations" 
          subtitle="Manage bookings and track customer history" 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reservations</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.today}</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Confirmed</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.confirmed}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                  <Users className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Reservations */}
          <Card className="border border-gray-100 mb-8">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Today's Reservations
              </CardTitle>
              <p className="text-gray-600 mt-1">
                {todayReservations?.length || 0} bookings scheduled for today
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {todayReservations && todayReservations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todayReservations.map((reservation) => (
                    <div key={reservation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{reservation.customerName}</h4>
                        <div className="flex items-center space-x-1">
                          {parseBoolean(reservation.isVip) && (
                            <Badge className="bg-blue-100 text-blue-700">
                              <Crown className="mr-1 w-3 h-3" />
                              VIP
                            </Badge>
                          )}
                          {reservation.noShowCount > 0 && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Flag className="mr-1 w-3 h-3" />
                              No-Show History
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="mr-2 w-4 h-4" />
                          {reservation.time}
                        </div>
                        <div className="flex items-center">
                          <Users className="mr-2 w-4 h-4" />
                          Party of {reservation.partySize}
                        </div>
                        {reservation.phone && (
                          <div className="flex items-center">
                            <Phone className="mr-2 w-4 h-4" />
                            {reservation.phone}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge className={getStatusColor(reservation.status)}>
                          {getStatusIcon(reservation.status)}
                          <span className="ml-1 capitalize">{reservation.status}</span>
                        </Badge>
                        {reservation.status === 'confirmed' && (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(reservation.id, 'completed')}
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(reservation.id, 'no-show')}
                            >
                              No Show
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No reservations scheduled for today</p>
              )}
            </CardContent>
          </Card>

          {/* All Reservations */}
          <Card className="border border-gray-100">
            <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">All Reservations</CardTitle>
                <p className="text-gray-600 mt-1">Complete reservation history and management</p>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="mr-2 w-4 h-4" />
                      New Reservation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Create New Reservation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateReservation} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customerName">Customer Name</Label>
                          <Input id="customerName" name="customerName" required />
                        </div>
                        <div>
                          <Label htmlFor="partySize">Party Size</Label>
                          <Select name="partySize" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1,2,3,4,5,6,7,8,9,10].map(size => (
                                <SelectItem key={size} value={size.toString()}>{size} {size === 1 ? 'Person' : 'People'}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" name="email" type="email" />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" name="phone" type="tel" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date">Date</Label>
                          <Input id="date" name="date" type="date" required />
                        </div>
                        <div>
                          <Label htmlFor="time">Time</Label>
                          <Select name="time" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'].map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="specialRequests">Special Requests</Label>
                        <Textarea 
                          id="specialRequests" 
                          name="specialRequests" 
                          placeholder="Any special requests or notes..."
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isVip" name="isVip" className="rounded" />
                        <Label htmlFor="isVip">Mark as VIP Guest</Label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {createMutation.isPending ? 'Creating...' : 'Create Reservation'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : filteredReservations.length > 0 ? (
                <div className="space-y-4">
                  {filteredReservations.map((reservation) => (
                    <div key={reservation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                              <span>{reservation.customerName}</span>
                              {parseBoolean(reservation.isVip) && (
                                <Crown className="w-4 h-4 text-blue-600" />
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {formatDate(reservation.date)} at {reservation.time} • Party of {reservation.partySize}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {reservation.noShowCount > 0 && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Flag className="mr-1 w-3 h-3" />
                              {reservation.noShowCount} No-Show{reservation.noShowCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                          <Badge className={getStatusColor(reservation.status)}>
                            {getStatusIcon(reservation.status)}
                            <span className="ml-1 capitalize">{reservation.status}</span>
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        {reservation.email && (
                          <div className="flex items-center">
                            <Mail className="mr-2 w-4 h-4" />
                            {reservation.email}
                          </div>
                        )}
                        {reservation.phone && (
                          <div className="flex items-center">
                            <Phone className="mr-2 w-4 h-4" />
                            {reservation.phone}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="mr-2 w-4 h-4" />
                          Created {formatDateTime(reservation.createdAt!)}
                        </div>
                      </div>

                      {reservation.specialRequests && (
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <p className="text-sm text-gray-700">
                            <strong>Special Requests:</strong> {reservation.specialRequests}
                          </p>
                        </div>
                      )}

                      {reservation.status === 'confirmed' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(reservation.id, 'completed')}
                            disabled={updateMutation.isPending}
                          >
                            Mark Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(reservation.id, 'cancelled')}
                            disabled={updateMutation.isPending}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(reservation.id, 'no-show')}
                            disabled={updateMutation.isPending}
                          >
                            Mark No-Show
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">
                  {filterStatus === "all" 
                    ? "No reservations yet. Create your first reservation to get started."
                    : `No reservations with status "${filterStatus}".`
                  }
                </p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

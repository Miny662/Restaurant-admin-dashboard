import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ResponseTemplate } from "@shared/schema";

export default function ResponseTemplates() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ResponseTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates } = useQuery<ResponseTemplate[]>({
    queryKey: ['/api/response-templates'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/response-templates', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/response-templates'] });
      toast({
        title: "Template created successfully",
        description: "Your response template has been saved",
      });
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to create template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PATCH', `/api/response-templates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/response-templates'] });
      toast({
        title: "Template updated successfully",
        description: "Your response template has been updated",
      });
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to update template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      template: formData.get('template') as string,
      isActive: true,
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'booking': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-lg font-semibold text-gray-900">AI Response Templates</CardTitle>
        <p className="text-gray-600 mt-1">Pre-generated messages for common scenarios</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {templates && templates.length > 0 ? (
            templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{template.name}</span>
                  <div className="flex items-center space-x-2">
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                    {template.isActive && (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 bg-gray-50 rounded p-3 mb-2">
                  {template.template}
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setEditingTemplate(template);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="mr-1 w-3 h-3" />
                  Edit Template
                </Button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No templates created yet</p>
          )}
        </div>

        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingTemplate(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 w-4 h-4" />
              Create New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingTemplate?.name || ''}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue={editingTemplate?.category || ''} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="no-show">No-Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="template">Template Content</Label>
                <Textarea 
                  id="template" 
                  name="template" 
                  rows={4}
                  defaultValue={editingTemplate?.template || ''}
                  placeholder="Enter your template message..."
                  required 
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending || updateMutation.isPending 
                    ? 'Saving...' 
                    : editingTemplate ? 'Update' : 'Create'
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

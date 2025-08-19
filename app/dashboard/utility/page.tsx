"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SquarePen, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { getUtility, updateUtility } from "@/components/api/utility";

type UtilitySettings = {
  _id?: string;
  email: string;
  phoneNo: string;
  facebookLink: string;
  instagramLink: string;
  linkedin: string;
  location: string;
  twitter: string;
  chatNumber: string;
};

export default function Utility() {
  const [utilitySettings, setUtilitySettings] = useState<UtilitySettings>({
    email: "",
    phoneNo: "",
    facebookLink: "",
    instagramLink: "",
    linkedin: "",
    location: "",
    twitter: "",
    chatNumber: "",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentField, setCurrentField] = useState<keyof UtilitySettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock API calls - replace with actual API calls
  const fetchUtilitySettings = async () => {
    try {
      // Replace with actual API call
      const res = await getUtility();
      console.log(res,"res");
      setUtilitySettings(res?.payload || {});
    } catch (err) {
      console.error("Failed to fetch utility settings:", err);
    }
  };

  const updateUtilitySetting = async (field: keyof UtilitySettings, value: string) => {
    try {
      setIsLoading(true);
      const updateData = { [field]: value };
      const utilityId = utilitySettings?._id || "";

      console.log(utilityId,"id");
      
      const response = await updateUtility(utilityId, updateData);
      
      setUtilitySettings(prev => ({
        ...prev,
        ...response.payload  // Assuming the API returns the updated settings
      }));
      toast.success(`${field} updated successfully`);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast.error(`Failed to update ${field}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilitySettings();
  }, []);

  const handleEditClick = (field: keyof UtilitySettings) => {
    setCurrentField(field);
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentField) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    const value = formData.get(currentField) as string;
    updateUtilitySetting(currentField, value);
  };

  const fieldLabels: Record<keyof Omit<UtilitySettings, '_id'>, string> = {
    email: "Email",
    phoneNo: "Phone Number",
    facebookLink: "Facebook Link",
    instagramLink: "Instagram Link",
    linkedin: "Linkedin Link",
    location: "Location",
    twitter: "Twitter Link",
    chatNumber: "Chat Number",
  };

  const fieldIcons: Record<keyof Omit<UtilitySettings, '_id'>, React.ReactNode> = {
    email: <Mail className="h-5 w-5 text-muted-foreground" />,
    phoneNo: <Phone className="h-5 w-5 text-muted-foreground" />,
    facebookLink: <Mail className="h-5 w-5 text-muted-foreground" />,
    instagramLink: <Phone className="h-5 w-5 text-muted-foreground" />,
    linkedin: <Mail className="h-5 w-5 text-muted-foreground" />,
    location: <Phone className="h-5 w-5 text-muted-foreground" />,
    twitter: <Mail className="h-5 w-5 text-muted-foreground" />,
    chatNumber: <Phone className="h-5 w-5 text-muted-foreground" />,
  };  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-foreground">Utility Settings</h1>
            </div>

      <div className="grid gap-6 md:grid-cols-4">
        {Object.entries(utilitySettings).filter(([key]) => !['_id', 'deletedAt','updatedAt'].includes(key)).map(([key, value]) => (
          <Card key={key} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">
                  {fieldLabels[key as keyof Omit<UtilitySettings, '_id'>]}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEditClick(key as keyof UtilitySettings)}
                >
                  <SquarePen className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                {fieldIcons[key as keyof Omit<UtilitySettings, '_id'>]}
                <span className="text-sm text-muted-foreground">{value || "Not set"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={currentField || ""}>
                {currentField}
              </Label>
              <Input
                name={currentField || ""}
                defaultValue={currentField ? utilitySettings[currentField] : ""}
                placeholder={`Enter ${currentField?.toLowerCase()}`}
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
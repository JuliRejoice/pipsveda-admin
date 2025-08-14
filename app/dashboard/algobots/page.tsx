"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createAlgoBot, getAllAlgoBots, deleteAlgoBot, updateAlgoBot } from "@/components/api/algobot";
import { Search, Plus, Bot, Calendar, Download, Edit, Trash2, MoreVertical, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "@/components/ui/DataTablePagination";

// Form validation schema
const formSchema = z.object({
  botName: z
    .string()
    .min(2, "Bot name must be at least 2 characters")
    .max(50, "Bot name must be at most 50 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Bot name can only contain letters, numbers, spaces, and hyphens"),

  description: z.string().min(10, "Description must be at least 10 characters"),

  price: z.string().optional(),

  validity: z
    .string()
    .min(1, "Validity is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Validity must be a valid date",
    })
    .refine((val) => new Date(val) > new Date(), {
      message: "Validity must be a future date",
    }),

  plan: z.string().min(1, "Plan name is required"),

  // image: z.any().optional()
  //   .refine((file) => !file || file.size <= 5 * 1024 * 1024, {
  //     message: 'Image must be less than 5MB',
  //   })
  //   .refine((file) => !file || file.type.startsWith('image/'), {
  //     message: 'File must be an image',
  //   })
});

type FormValues = z.infer<typeof formSchema>;

type Plan = {
  planType: string;
  value: number;
};

interface AlgoBot {
  _id: string;
  botName: string;
  description: string;
  plans: Plan[];
  validity: string;
  isActive: boolean;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AlgoBots() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBotId, setCurrentBotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [algobots, setAlgobots] = useState<AlgoBot[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [botToDelete, setBotToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [step, setStep] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      botName: "",
      description: "",
      price: "",
      validity: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = form;

  // Custom price validation state
  const [priceError, setPriceError] = useState<string | null>(null);

  // Fetch bots on component mount
  const fetchBots = async () => {
    try {
      setIsFetching(true);
      const response = await getAllAlgoBots({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });

      setAlgobots(response.payload.data || []);
      setTotalItems(response.payload.count || 0);
      setTotalPages(Math.ceil((response.payload.count || 0) / itemsPerPage));
    } catch (error) {
      console.error("Error fetching bots:", error);
      toast.error("Failed to fetch algo bots");
    } finally {
      setIsFetching(false);
    }
  };

  console.log(algobots);

  useEffect(() => {
    fetchBots();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Handle form submission for both create and update
  const onSubmit = async (data: FormValues) => {
    // Validate that either price is provided OR plans exist
    if (!data.price && plans.length === 0) {
      setPriceError("Price is required");
      return;
    }

    // Clear any price errors for submission
    setPriceError(null);
    try {
      setIsLoading(true);

      // Format the data according to the API requirements
      const formData = new FormData();
      formData.append("botName", data.botName);
      formData.append("description", data.description);
      formData.append("validity", data.validity);

      plans.forEach((plan, index) => {
        formData.append(`plans[${index}][planType]`, plan.planType);
        formData.append(`plans[${index}][value]`, plan.value.toString());
      });

      if (isEditMode && currentBotId) {
        await updateAlgoBot(currentBotId, formData);
        toast.success("AlgoBot updated successfully");
      } else {
        await createAlgoBot(formData);
        toast.success("AlgoBot created successfully");
      }

      setIsOpen(false);
      reset();
      setPlans([]);
      setCurrentPage(1);
      await fetchBots();
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} AlgoBot:`, error);
      toast.error(`Failed to ${isEditMode ? "update" : "create"} AlgoBot`);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up form for editing
  const handleEdit = (bot: AlgoBot) => {
    setCurrentBotId(bot._id);
    setIsEditMode(true);
    
    // Reset the form with bot data
    reset({
      botName: bot.botName,
      description: bot.description,
      validity: bot.validity,
      price: '', // Clear the price field when editing
      plan: '1' // Reset plan selector to default
    });
    
    // Set the existing plans
    setPlans([...bot.plans]);
    
    // Reset the form step to 1
    setStep(1);
    setIsOpen(true);
  };

  // Handle delete with confirmation dialog
  const handleDeleteClick = (id: string) => {
    setBotToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!botToDelete) return;

    try {
      setIsDeleting(true);
      await deleteAlgoBot(botToDelete);
      toast.success("AlgoBot deleted successfully");
      setAlgobots(algobots.filter((bot) => bot._id !== botToDelete));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting AlgoBot:", error);
      toast.error("Failed to delete AlgoBot");
    } finally {
      setIsDeleting(false);
      setBotToDelete(null);
    }
  };

  // Reset form for creating new bot
  const handleCreateNew = () => {
    reset({
      botName: "",
      description: "",
      price: "",
      validity: "",
    });
    setCurrentBotId(null);
    setIsEditMode(false);
    setIsOpen(true);
  };

  const filteredBots = algobots.filter((bot) => bot.botName.toLowerCase().includes(searchTerm.toLowerCase()) || bot.description.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleAddPlan = () => {
    const { plan, price } = getValues();

    // Validate price field manually
    if (!price || price.trim() === "") {
      setPriceError("Price is required");
      return;
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      setPriceError("Price must be a valid number");
      return;
    }

    if (parseFloat(price) > 1000000) {
      setPriceError("Price must be less than 1,000,000");
      return;
    }

    // Clear price error if validation passes
    setPriceError(null);

    if (!plan) return;

    const planNumber = parseInt(plan, 10);
    const newPlan: Plan = {
      planType: `${planNumber} month`,
      value: Number(price),
    };

    // Check if a plan with the same duration already exists
    const planExists = plans.some(p => p.planType === newPlan.planType);
    
    if (planExists) {
      // Update existing plan instead of adding a new one
      setPlans(prev => 
        prev.map(p => 
          p.planType === newPlan.planType ? newPlan : p
        )
      );
    } else {
      // Add new plan
      setPlans(prev => [...prev, newPlan]);
    }

    // Reset form fields
    setValue("plan", "1");
    setValue("price", "");
  };

  const handleRemovePlan: (indexToRemove: number) => void = (indexToRemove) => {
    setPlans((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AlgoBots</h1>
          <p className="text-muted-foreground">Manage your trading bots and their configurations</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setIsEditMode(false);
              reset();
              setPlans([]);
            }}>
              <Plus className="mr-2 h-4 w-4" /> Add New Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit AlgoBot' : 'Create New AlgoBot'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* LEFT: Step Sidebar */}
              <div className="flex space-x-6">
                <div className={`pb-2 font-semibold ${step === 1 ? "text-foreground border-b-2 border-primary" : "text-gray-400 border-b-2 border-transparent"}`}>Bot Details</div>
                <div className={`pb-2 font-semibold ${step === 2 ? "text-foreground border-b-2 border-primary" : "text-gray-400 border-b-2 border-transparent"}`}>Plans</div>
              </div>

              {/* RIGHT: Form Step Content */}
              <div className="space-y-4">
                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="botName">Bot Name</Label>
                      <Input id="botName" placeholder="Enter bot name" {...register("botName")} className={errors.botName ? "border-red-500" : ""} />
                      {errors.botName && <p className="text-sm text-red-500">{errors.botName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Enter bot description" {...register("description")} className={errors.description ? "border-red-500" : ""} rows={3} />
                      {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">Bot Image (Optional)</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          // Handle file upload if needed
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validity">Validity (Expiry Date)</Label>
                      <Input id="validity" type="date" {...register("validity")} className={errors.validity ? "border-red-500" : ""} />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={async () => {
                          const isStepValid = await trigger(["botName", "description", "validity"]);
                          if (isStepValid) {
                            setStep(2);
                          }
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="plan">Plan Duration</Label>
                      <select id="plan" defaultValue="1" {...register("plan")} className="w-full bg-background rounded-md border px-3 py-2 text-sm shadow-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="1 month">1 month</option>
                        <option value="3 month">3 month</option>
                        <option value="6 month">6 month</option>
                        <option value="9 month">9 month</option>
                        <option value="12 month">12 month</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input id="price" type="number" placeholder="0.00" {...register("price")} className={errors.price ? "border-red-500" : ""} />
                      {priceError && <p className="text-sm text-red-500">{priceError}</p>}
                    </div>

                    <div className="pt-2">
                      <Button type="button" onClick={handleAddPlan}>
                        Add Plan
                      </Button>
                    </div>

                    {/* Added Plans List */}
                    {plans.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Added Plans</h4>
                        {plans.map((plan, index) => (
                          <div key={index} className="border rounded-md p-3 bg-background text-sm flex justify-between items-center">
                            <div>
                              <p>
                                <strong>Duration:</strong> {plan.planType}
                              </p>
                              <p>
                                <strong>Price:</strong> ${plan.value}
                              </p>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePlan(index)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button type="submit" disabled={isLoading || (plans.length === 0 && !getValues().price)}>
                        {isLoading ? (isEditMode ? "Updating..." : "Creating...") : isEditMode ? "Update Bot" : "Create Bot"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search bots..."
          className="w-full bg-background pl-8 md:w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isFetching ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {algobots.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
              <Bot className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No algobots found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Get started by creating a new algobot'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {algobots.map((bot) => (
                <Card key={bot._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold line-clamp-1">
                        {bot.botName}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(bot)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(bot._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-4 w-4" />
                      <span>Valid until: {new Date(bot.validity).toLocaleDateString()}</span>
                    </div>
                    <Badge variant={bot.isActive ? 'default' : 'secondary'} className="w-fit">
                      {bot.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {bot.description}
                        </p>
                        {/* {bot.description.split('\n').length > 2 && (
                          <span className="text-xs text-muted-foreground">...</span>
                        )} */}
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="text-2xl font-bold">
                          ${bot?.plans?.[0].value}
                          <span className="text-sm font-normal text-muted-foreground">/month</span>
                        </div>
                        <Button size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {totalItems > itemsPerPage && (
            <div className="mt-6">
              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
                itemsPerPageOptions={[10, 20, 30, 50]}
                className="border-t pt-4"
              />
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete AlgoBot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to delete this bot? This action cannot be undone.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

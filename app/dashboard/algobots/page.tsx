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
  duration: string;
  price: number;
};

interface AlgoBot {
  _id: string;
  botName: string;
  description: string;
  price: number;
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
        formData.append(`plans[${index}][planType]`, plan.duration);
        formData.append(`plans[${index}][value]`, plan.price.toString());
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
    reset({
      botName: bot.botName,
      description: bot.description,
      validity: bot.validity,
    });
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
      <div className="flex justify-center items-center min-h-[70vh] items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
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
      duration: `${planNumber} month`,
      price: Number(price),
    };

    setPlans((prev) => [...prev, newPlan]);

    setValue("plan", "1");
    setValue("price", "");
  };

  const handleRemovePlan = (indexToRemove: number) => {
    setPlans((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div>
      <div className="flex items-center justify-between p-6">
        {/*  <h1 className="text-2xl font-bold">AlgoBots</h1> */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search algobots..." value={searchTerm} onChange={handleSearch} className="pl-10" />
        </div>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) {
              reset({
                botName: "",
                description: "",
                price: "",
                validity: "",
              });
              setPlans([]);
              setStep(1);
              setCurrentBotId(null);
              setIsEditMode(false);
            }
            setIsOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create AlgoBot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="pb-3">{isEditMode ? "Edit AlgoBot" : "Create New AlgoBot"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                                <strong>Duration:</strong> {plan.duration}
                              </p>
                              <p>
                                <strong>Price:</strong> ${plan.price}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 px-6">
        {filteredBots.length > 0 ? (
          filteredBots.map((bot) => (
            <Card key={bot._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{bot.botName}</CardTitle>
                      <p className="text-sm text-gray-500">{bot.description}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(bot)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download Code
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(bot._id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">${bot.price}</span>
                    <Badge variant={bot.isActive ? "default" : "secondary"}>{bot.isActive ? "Active" : "Inactive"}</Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Valid Before{" "}
                      {new Date(bot.validity).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div>📊 0 sales</div>
                  </div>
                  {/*                   
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Code
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(bot)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div> */}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">No algobots found. Create your first one!</p>
          </div>
        )}
      </div>

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete AlgoBot
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>Are you sure you want to delete this bot? This action cannot be undone.</AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

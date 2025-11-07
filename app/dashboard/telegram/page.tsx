"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Users,
  Pencil,
  AlertTriangle,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  createChannel,
  updateChannel,
  getAllTelegram,
  deleteChannel,
  createChannelPlan,
  updateChannelPlan,
  getAllTelegramPlan,
  deleteChannelPlan,
} from "@/components/api/telegram";
import { initScriptLoader } from "next/script";
import { uploadImage } from "@/components/api/course";

// Form validation schema
const formSchema = z.object({
  channelName: z
    .string()
    .nonempty("Channel name is required")
    .min(2, "Channel name must be at least 2 characters")
    .max(50, "Channel name must be at most 50 characters")
    .regex(
      /^[a-zA-Z0-9\s\-()]+$/,
      "Channel name can only contain letters, numbers, spaces, hyphens, and parentheses"
    ),

  description: z
    .string()
    .nonempty("Description is required")
    .min(10, "Description must be at least 10 characters"),

  link: z
    .string()
    .min(1, "Telegram link is required")
    .refine((val) => /^https?:\/\/.+\..+/.test(val), {
      message: "Please enter a valid HTTP/HTTPS URL",
    }),

  plan: z.string().optional(),
  price: z.string().optional(),
  discount: z.string().optional(),
  botProviderId: z.string().optional(),
  botId: z.string().optional(),
  image: z.string().min(1, { message: "Please upload a channel image" }),
  logo: z.string().min(1, { message: "Please upload a channel logo" }),
});

type FormValues = z.infer<typeof formSchema>;

type Plan = {
  _id?: string;
  planType: string;
  value: number;
  price: string;
  botId: string;
  botProviderId: string;
  discount: string;
  initialPrice: number;
};

interface TelegramChannel {
  _id: string;
  channelName: string;
  description: string;
  link: string;
  plans: Plan[];
  status: string;
  subscribers: number;
  createdAt?: string;
  updatedAt?: string;
  telegramPlan?: any[];
  image?: string;
  logo?: string;
}

export default function TelegramManagement() {
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [planEdit, setPlanEdit] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channelName: "",
      description: "",
      link: "",
      plan: "",
      price: "",
      discount: "",
      botProviderId: "",
      botId: "",
      image: "",
      logo: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    trigger,
    setError,
    clearErrors,
    formState: { errors },
  } = form;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) {
      toast.error("Only image files are allowed (JPEG, PNG, etc.)");
      return;
    }
    if (file) {
      try {
        setIsLoading(true);
        const response: any = await uploadImage(file);
        console.log("Upload response:", response);
        if (response?.success) {
          setImageFile(response.payload);
          setImagePreview(URL.createObjectURL(file)); // Use object URL for preview
          // setImagePreview(response.payload); // Use object URL for preview

          setValue("image", response.payload, { shouldValidate: true });
          toast.success("Image uploaded successfully");
        } else {
          toast.error("Failed to upload image");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Error uploading image");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) {
      toast.error("Only image files are allowed (JPEG, PNG, etc.)");
      return;
    }
    if (file) {
      try {
        setIsLoading(true);
        const response: any = await uploadImage(file);
        if (response?.success) {
          setLogoFile(response.payload);
          setLogoPreview(URL.createObjectURL(file));
          console.log(response.payload, "sjdhyj");
          // setLogoPreview(response.payload);
          setValue("logo", response.payload, { shouldValidate: true });
          toast.success("Logo uploaded successfully");
        } else {
          toast.error("Failed to upload logo");
        }
      } catch (error) {
        console.error("Error uploading logo:", error);
        toast.error("Error uploading logo");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setValue("image", "");
    trigger("image");
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setValue("logo", "");
    trigger("logo");
  };

  const fetchChannels = async () => {
    try {
      setIsFetching(true);
      const response = await getAllTelegram();

      if (response.success) {
        setChannels(response.payload.data || []);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const onSubmitStep1 = async (data: FormValues) => {
    try {
      setIsLoading(true);

      const formData = {
        channelName: data.channelName,
        description: data.description,
        link: data.link,
        image: imageFile || data.image || "",
        logo: logoFile || data.logo || "",
      };
      
      let response;

      if (isEditMode && currentChannelId) {
        response = await updateChannel(currentChannelId, formData);
        if (response.success) {
          toast.success("Channel updated successfully");
          await fetchChannels(); // Refresh the list
          setStep(2);
        } else {
          toast.error(response.message || "Failed to update channel");
          return false;
        }
      } else {
        response = await createChannel(formData);
        if (response.success) {
          setCurrentChannelId(response.payload._id);
          toast.success("Channel created successfully");
          await fetchChannels(); // Refresh the list after creation
          setStep(2);
        } else {
          toast.error(response.message || "Failed to create channel");
          return false;
        }
      }

      setStep(2);
    } catch (error) {
      toast.error("Failed to proceed to next step");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitSecond = async (data: FormValues) => {
    try {
      setIsLoading(true);

      if (isEditMode && currentChannelId) {
        const updatePlanPromises = plans.map((plan) => {
          const planData = {
            telegramId: currentChannelId,
            planType: plan.planType,
            price: parseFloat(plan.price),
            discount: parseFloat(plan.discount) || 0,
          };

          if (plan._id && !plan._id.startsWith("temp_")) {
            return updateChannelPlan(plan._id, planData);
          }
          return createChannelPlan(planData);
        });

        const results = await Promise.all(updatePlanPromises);
        const allSuccessful = results.every((result) => result?.success);

        if (allSuccessful) {
          toast.success("All plans updated successfully");
        } else {
          toast.error("Some plans failed to update");
          return;
        }
      } else if (currentChannelId) {
        const createPlanPromises = plans.map((plan) => {
          const planData = {
            telegramId: currentChannelId,
            planType: plan.planType,
            price: parseFloat(plan.price),
            discount: parseFloat(plan.discount) || 0,
          };
          return createChannelPlan(planData);
        });

        // Wait for all plan creations to complete
        const results = await Promise.all(createPlanPromises);
        const allSuccessful = results.every((result) => result?.success);

        if (allSuccessful) {
          toast.success("All plans created successfully");
        } else {
          toast.error("Some plans failed to save");
          return;
        }
      }

      setIsOpen(false);
      reset();
      setPlans([]);
      setCurrentChannelId(null);
      setStep(1);
      await fetchChannels(); // Refresh the list
    } catch (error) {
      console.error("Error saving plans:", error);
      toast.error("Failed to save plans");
    } finally {
      setIsLoading(false);
    }
  };

  // Set up form for editing
  const handleEdit = async (channel: TelegramChannel) => {
    setCurrentChannelId(channel._id);
    setIsEditMode(true);

    // Set preview states
    setImagePreview(channel.image || null);
    setLogoPreview(channel.logo || null);
    setImageFile(null);
    setLogoFile(null);

    // Reset form with channel data
    reset({
      channelName: channel.channelName,
      description: channel.description,
      link: channel.link,
      plan: "",
      price: "",
      discount: "",
      botProviderId: "",
      botId: "",
      image: channel.image || "",
      logo: channel.logo || "",
    });

    try {
      // Fetch existing plans for this channel
      const response = await getAllTelegramPlan(channel._id);

      if (response.success && response.payload?.data) {
        // Map the response to match our Plan type
        const existingPlans = response.payload.data.map((plan: any) => ({
          _id: plan._id,
          planType: plan.planType,
          price: plan.price.toString(),
          discount: plan.discount ? plan.discount.toString() : "0",
          initialPrice: plan.initialPrice,
        }));
        setPlans(existingPlans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }

    setStep(1);
    setIsOpen(true);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    setChannelToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!channelToDelete) return;

    try {
      setIsDeleting(true);
      const response = await deleteChannel(channelToDelete);
      if (response.success) {
        toast.success("Channel deleted successfully");
        await fetchChannels(); // Refresh the list
      } else {
        toast.error("Failed to delete channel");
      }
    } catch (error) {
      console.error("Error deleting channel:", error);
      toast.error("Failed to delete channel");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setChannelToDelete(null);
    }
  };

  // Reset form for creating new channel
  const handleCreateNew = () => {
    reset({
      channelName: "",
      description: "",
      link: "",
      plan: "",
      price: "",
      discount: "",
      botProviderId: "",
      botId: "",
      image: "",
      logo: "",
    });
    setPlans([]);
    setCurrentChannelId(null);
    setImageFile(null);
    setLogoFile(null);
    setImagePreview(null);
    setLogoPreview(null);
    setStep(1);
    setIsEditMode(false);
    setIsOpen(true);
    setStep(1);
    setPlanEdit(false);
    setEditingPlanId(null);
  };

  const handleAddPlan = async () => {
    const { plan, price, discount } = getValues();

    // Validate required fields for adding a plan
    let hasError = false;

    if (!plan || String(plan).trim() === "") {
      setError(
        "plan" as any,
        { type: "manual", message: "Plan duration is required" } as any
      );
      hasError = true;
    }

    const priceValue = String(price || "").trim();
    // Price validation
    const priceNum = parseFloat(priceValue);
    const priceParts = priceValue.split(".");

    if (!priceValue) {
      setPriceError("Price is required");
      setError(
        "price" as any,
        { type: "manual", message: "Price is required" } as any
      );
      hasError = true;
    } else if (isNaN(priceNum) || priceNum <= 0) {
      setPriceError("Price must be a valid positive number");
      setError(
        "price" as any,
        {
          type: "manual",
          message: "Price must be a valid positive number",
        } as any
      );
      hasError = true;
    } else if (priceNum > 1000000) {
      setPriceError("Price must be less than 1,000,000");
      setError(
        "price" as any,
        { type: "manual", message: "Price must be less than 1,000,000" } as any
      );
      hasError = true;
    } else if (priceParts[1] && priceParts[1].length !== 2) {
      setPriceError("Price must have exactly 2 decimal places");
      setError(
        "price" as any,
        {
          type: "manual",
          message: "Price must have exactly 2 decimal places",
        } as any
      );
      hasError = true;
    }

    // Discount validation
    const discountValue = String(discount || "0").trim();
    const discountNum = parseInt(discountValue, 10);

    if (discountValue && !/^\d+$/.test(discountValue)) {
      setError(
        "discount" as any,
        { type: "manual", message: "Discount must be a whole number" } as any
      );
      hasError = true;
    } else if (discountValue && (discountNum < 0 || discountNum > 99)) {
      setError(
        "discount" as any,
        { type: "manual", message: "Discount must be between 0 and 99" } as any
      );
      hasError = true;
    }

    if (hasError) return;

    const newPlan: Plan = {
      _id:
        planEdit && editingPlanId
          ? editingPlanId
          : `temp_${Date.now()}_${Math.random()}`,
      planType: plan || "",
      price: String(price || ""),
      discount: String(discount || "0"),
      value: parseFloat(price as string) || 0,
      botId: "",
      botProviderId: "",
      initialPrice: parseFloat(price as string) || 0,
    };

    try {
      if (planEdit && editingPlanId) {
        setPlans((prev: Plan[]) =>
          prev.map((p) => (p._id === editingPlanId ? { ...p, ...newPlan } : p))
        );
        toast.success("Plan updated successfully");
        setPlanEdit(false);
        setEditingPlanId(null);
      } else {
        setPlans((prev: any[]) => [...prev, newPlan]);
        toast.success("Plan added successfully");
      }

      setValue("plan", "");
      reset({
        ...getValues(),
        plan: "",
        price: "",
        discount: "",
        botProviderId: "",
        botId: "",
      });
      clearErrors(["plan", "price", "discount"] as any);
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan");
    }
  };

  const handleEditPlan = (index: number) => {
    const plan = plans[index];

    if (!plan) return;

    setPlanEdit(true);
    setEditingPlanId(plan._id || null);

    // Reset the form first to clear any existing values
    reset({
      ...getValues(),
      plan: plan.planType || "",
      price: (plan.initialPrice || plan.price)?.toString() || "",
      discount: plan.discount?.toString() || "0",
    });

    // Scroll to the form
    setTimeout(() => {
      const formElement = document.getElementById("plan-form");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleRemovePlan = async (indexToRemove: number) => {
    const planToDelete = plans[indexToRemove];

    try {
      if (planToDelete._id && !planToDelete._id.startsWith("temp_")) {
        setIsDeleting(true);
        await deleteChannelPlan(planToDelete._id);
        toast.success("Plan deleted successfully");
      } else {
        // This is a temporary plan, just remove from local state
        toast.success("Plan removed");
      }

      // Update local state to remove the plan
      setPlans((prev) => prev.filter((plan) => plan._id !== planToDelete._id));
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Telegram Channel Management
          </h1>
          <p className="text-muted-foreground">
            Manage your Telegram channels and their configurations
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> Create Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode
                  ? "Edit Telegram Channel"
                  : "Create New Telegram Channel"}
              </DialogTitle>
            </DialogHeader>

            {/* Step Sidebar */}
            <div className="flex space-x-6">
              <div
                onClick={() => setStep(1)}
                className={`pb-2 font-semibold cursor-pointer ${
                  step === 1
                    ? "text-foreground border-b-2 border-primary"
                    : "text-gray-400 border-b-2 border-transparent hover:text-foreground/80"
                }`}
              >
                Channel Details
              </div>
              <div
                onClick={() => setStep(2)}
                className={`pb-2 font-semibold cursor-pointer ${
                  step === 2
                    ? "text-foreground border-b-2 border-primary"
                    : "text-gray-400 border-b-2 border-transparent hover:text-foreground/80"
                }`}
              >
                Plans
              </div>
            </div>

            {/* Form Step Content */}
            <div className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="channelName">Channel Name *</Label>
                      <Input
                        id="channelName"
                        placeholder="Enter channel name"
                        {...register("channelName")}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          setValue("channelName", value, {
                            shouldValidate: true,
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === " " && !e.currentTarget.value.trim()) {
                            e.preventDefault();
                          }
                        }}
                        className={errors.channelName ? "border-red-500" : ""}
                      />
                      {errors.channelName && (
                        <p className="text-sm font-semibold text-red-500">
                          {errors.channelName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter channel description"
                        {...register("description")}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          setValue("description", value, {
                            shouldValidate: true,
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === " " && !e.currentTarget.value.trim()) {
                            e.preventDefault();
                          }
                        }}
                        className={errors.description ? "border-red-500" : ""}
                        rows={4}
                      />
                      {errors.description && (
                        <p className="text-sm font-semibold text-red-500">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="link">Telegram Link *</Label>
                      <Input
                        id="link"
                        placeholder="https://t.me/yourchannel"
                        {...register("link")}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          setValue("link", value, { shouldValidate: true });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === " " && !e.currentTarget.value.trim()) {
                            e.preventDefault();
                          }
                        }}
                        className={errors.link ? "border-red-500" : ""}
                      />
                      {errors.link && (
                        <p className="text-sm font-semibold text-red-500">
                          {errors.link.message}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <Label htmlFor="image">Channel Image *</Label>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <label
                              htmlFor="image"
                              className="flex flex-col items-center justify-center w-64 h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
                            >
                              {imagePreview || getValues("image") ? (
                                <div className="relative w-full h-full">
                                  <img
                                    src={imagePreview || getValues("image")}
                                    alt="Channel preview"
                                    className="object-cover w-full h-full rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeImage();
                                    }}
                                    className="absolute p-1 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                  <ImageIcon className="w-8 h-8 mb-1" />
                                  <span className="text-sm">Upload Image</span>
                                </div>
                              )}
                              <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                              />
                            </label>
                          </div>
                        </div>

                        {errors.image && (
                          <p className="text-sm font-semibold text-red-500">
                            {errors.image.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="logo">Channel Logo *</Label>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <label
                              htmlFor="logo"
                              className="flex flex-col items-center justify-center w-64 h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
                            >
                              {logoPreview || getValues("logo") ? (
                                <div className="relative w-full h-full">
                                  <img
                                    src={logoPreview || getValues("logo")}
                                    alt="Logo preview"
                                    className="object-cover w-full h-full "
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeLogo();
                                    }}
                                    className="absolute p-1 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                  <ImageIcon className="w-6 h-6 mb-1" />
                                  <span className="text-sm">Upload Logo</span>
                                </div>
                              )}
                              <Input
                                id="logo"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoChange}
                              />
                            </label>
                            {errors.logo && (
                              <p className="text-sm font-semibold text-red-500 ">
                                {errors.logo.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 py-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={async () => {
                          const isStepValid = await trigger([
                            "channelName",
                            "description",
                            "link",
                            "image", // Add these two fields
                            "logo",
                          ]);
                          if (isStepValid) {
                            const formData = getValues();
                            await onSubmitStep1(formData);
                          }
                        }}
                        disabled={isLoading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <form
                    onSubmit={handleSubmit(onSubmitSecond)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="plan">Plan Duration</Label>
                      <select
                        id="plan"
                        {...register("plan")}
                        onChange={(e) => {
                          setValue("plan", e.target.value);
                          if (planEdit && editingPlanId) {
                            setPlans((prev) =>
                              prev.map((plan) =>
                                plan._id === editingPlanId
                                  ? { ...plan, planType: e.target.value }
                                  : plan
                              )
                            );
                          }
                        }}
                        className={`w-full h-[55px] bg-background rounded-md border px-3 py-2 text-base font-semibold shadow-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.plan ? "border-red-500" : ""
                        }`}
                      >
                        <option value="">Select a plan</option>
                        {[
                          { value: "1Month", label: "1 month" },
                          { value: "3Months", label: "3 months" },
                          { value: "6Months", label: "6 months" },
                          { value: "9Months", label: "9 months" },
                          { value: "12Months", label: "12 months" },
                        ]
                          .filter((planOption) => {
                            if (planEdit && editingPlanId) {
                              const editingPlan = plans.find(
                                (p) => p._id === editingPlanId
                              );
                              if (
                                editingPlan &&
                                editingPlan.planType === planOption.value
                              ) {
                                return true;
                              }
                            }
                            return !plans.some(
                              (p) => p.planType === planOption.value
                            );
                          })
                          .map((planOption) => (
                            <option
                              key={planOption.value}
                              value={planOption.value}
                            >
                              {planOption.label}
                            </option>
                          ))}
                      </select>
                      {errors.plan && (
                        <p className="text-sm font-semibold text-red-500">
                          {String((errors as any).plan?.message || "")}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        onInput={(e) => {
                          const value = e.currentTarget.value;
                          if (value.includes(".")) {
                            const [whole, decimal] = value.split(".");
                            if (decimal && decimal.length > 2) {
                              e.currentTarget.value = `${whole}.${decimal.slice(
                                0,
                                2
                              )}`;
                            }
                          }
                        }}
                        placeholder="0.00"
                        {...register("price")}
                        className={errors.price ? "border-red-500" : ""}
                      />
                      {errors.price && (
                        <p className="text-sm font-semibold text-red-500">
                          {String((errors as any).price?.message || "")}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        placeholder="0"
                        {...register("discount")}
                        className={errors.discount ? "border-red-500" : ""}
                      />
                      {errors.discount && (
                        <p className="text-sm font-semibold text-red-500">
                          {String((errors as any).discount?.message || "")}
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        onClick={handleAddPlan}
                        id="plan-form"
                        disabled={isLoading}
                      >
                        {planEdit ? "Update Plan" : "Add Plan"}
                      </Button>
                    </div>

                    {/* Added Plans List */}
                    {plans.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Added Plans</h4>
                        {plans.map((plan, index) => (
                          <div
                            key={index}
                            className="border rounded-md p-3 bg-background text-sm flex justify-between items-center"
                          >
                            <div>
                              <p>
                                <strong>Duration:</strong> {plan.planType}
                              </p>
                              <p>
                                <strong>Price:</strong>{" "}
                                {plan?._id
                                  ? `$${plan.initialPrice}`
                                  : `$${plan.price}`}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPlan(index)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePlan(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Channel"}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Telegram Channel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert variant="destructive" className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <AlertDescription>
                  Are you sure you want to delete this channel? This action
                  cannot be undone.
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
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-medium">No channels found</h3>
            <p className="text-sm text-muted-foreground font-lexend">
              Get started by creating a new channel
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Card
              key={channel._id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="w-full rounded-md overflow-hidden border-2 border-white shadow-sm">
                  <img
                    src={
                      channel?.image?.startsWith?.("blob:") || !channel?.image
                        ? ""
                        : channel.image
                    }
                    alt={channel.channelName}
                    className="w-full h-48 object-cover rounded-t-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                          <img
                            src={
                              channel?.logo?.startsWith?.("blob:") ||
                              !channel?.logo
                                ? ""
                                : channel.logo
                            }
                            alt={`${channel.channelName} logo`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span>{channel.channelName}</span>
                      </CardTitle>

                      <p className="text-base text-gray-500 mt-2.5">
                        {channel.description}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(channel)}>
                        <Edit className="mr-2 h-5 w-5" />
                        <span className="text-base font-semibold">Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(channel._id)}
                      >
                        <Trash2 className="mr-2 h-5 w-5" />
                        <span className="text-base font-semibold">Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {channel.link && (
                    <a
                      href={channel.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 px-3 py-1 text-background bg-foreground rounded-sm text-base font-medium transition"
                    >
                      ▶ Join Channel
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {channel?.telegramPlan?.map((plan: any, idx: number) => (
                      <Card className="p-3">
                        <CardContent className="p-0">
                          <div
                            key={idx}
                            className="flex items-center justify-between"
                          >
                            <p className="text-sm text-muted-foreground font-lexend">
                              {plan.planType}
                            </p>
                            <p className="text-sm font-medium">
                              ${parseFloat(plan.initialPrice || 0).toFixed(2)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

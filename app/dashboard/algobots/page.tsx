"use client";

import { useState, useEffect } from "react";
import { marked } from "marked";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/dashboard/RichTextEditor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createAlgoBot, getAllAlgoBots, deleteAlgoBot, updateAlgoBot, getCategoryDropdown, getBotProviderDropDown, getBotDropDown, uploadAlgoBotImage, createAlgoBotPlan, updateAlgoBotPlan, deleteAlgoBotPlan, getLanguageDropDown } from "@/components/api/algobot";
import { Search, Plus, Bot, Calendar, Download, Edit, Trash2, MoreVertical, AlertTriangle, ChevronDown, Pencil, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "@/components/ui/DataTablePagination";

// Form validation schema
const formSchema = z.object({
  title: z
    .string()
    .nonempty("Strategy title is required")
    .min(2, "Strategy name must be at least 2 characters")
    .max(50, "Strategy name must be at most 50 characters")
    .regex(/^[a-zA-Z0-9\s\-()]+$/, "Strategy name can only contain letters, numbers, spaces, hyphens, and parentheses"),

  categoryId: z.string().min(1, "Category is required"),

  shortDescription: z.string().nonempty("Short Description is required").min(10, "Short description must be at least 10 characters").max(200, "Short description must be at most 200 characters"),

  description: z
    .string()
    .nonempty("Description is required")
    .refine(
      (val) => {
        // Remove HTML tags and check if there's actual content
        const textContent = val.replace(/<[^>]*>?/gm, "").trim();
        return textContent.length >= 10;
      },
      { message: "Description must be at least 10 characters" }
    ),

  price: z.string().optional(),

  discount: z.string().optional(),

  botProviderId: z.string().optional(),
  botId: z.string().optional(),

  plan: z.string().optional(),

  links: z
    .array(
      z.object({
        url: z
          .string()
          .min(1, "Video link URL is required")
          .refine((val) => /^https?:\/\/.+\..+/.test(val), { message: "Please enter a valid HTTP/HTTPS URL" }),
        language: z.string().min(1, "Language is required"),
      })
    )
    .min(1, "At least one video link is required"),

  imageUrl: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Plan = {
  _id?: string;
  planType: string;
  value: number;
  price: string;
  botId: {
    _id: string;
    botProviderId: {
      _id: string;
      companyName: string;
    };
    name: string;
  };
  botProviderId: string;
  discount: string;
  initialPrice: number;
};

interface TutorialLink {
  _id?: string;
  url: string;
  language: string;
}

interface Category {
  _id: string;
  title: string;
  description?: string;
}

interface BotProvider {
  _id: string;
  companyName?: string;
  name?: string;
}

interface BotItem {
  _id: string;
  name: string;
  botProviderId?: string;
}

interface AlgoBot {
  _id: string;
  title: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  plans: Plan[];
  validity: string;
  isActive: boolean;
  imageUrl?: string;
  links?: TutorialLink[];
  createdAt?: string;
  updatedAt?: string;
  strategyPlan?: Plan[];
  link?: TutorialLink[];
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
  const [step1, setStep1] = useState({ links: [{ url: "", language: "" }] });
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [providers, setProviders] = useState<BotProvider[]>([]);
  const [bots, setBots] = useState<BotItem[]>([]);
  const [filteredBots, setFilteredBots] = useState<BotItem[]>([]);
  const [isFetchingProviders, setIsFetchingProviders] = useState(false);
  const [isFetchingBotsList, setIsFetchingBotsList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [botPlanId, setBotPlanId] = useState<string | null>(null);
  const [planEdit, setPlanEdit] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<{ _id: string; languageName: string }[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<AlgoBot | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      categoryId: "",
      shortDescription: "",
      description: "",
      price: "",
      discount: "",
      botProviderId: "",
      botId: "",
      links: [{ url: "", language: "" }],
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
    watch,
    formState: { errors },
  } = form;

  // Fetch dropdown data: categories, providers, and bots
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsFetchingCategories(true);
        const data = await getCategoryDropdown();
        setCategories(data.payload || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setIsFetchingCategories(false);
      }
    };

    const fetchProviders = async () => {
      try {
        setIsFetchingProviders(true);
        const data = await getBotProviderDropDown();
        setProviders(data.payload || []);
      } catch (error) {
        console.error("Failed to load bot providers:", error);
      } finally {
        setIsFetchingProviders(false);
      }
    };

    const fetchBotsList = async () => {
      try {
        setIsFetchingBotsList(true);
        const data = await getBotDropDown();
        // Expecting data.payload or data; support both
        const list = data.payload || [];

        setBots(list);
      } catch (error) {
        console.error("Failed to load bots:", error);
      } finally {
        setIsFetchingBotsList(false);
      }
    };

    fetchCategories();
    fetchProviders();
    fetchBotsList();
  }, []);

  // Update filtered bots when provider changes
  useEffect(() => {
    const providerId = getValues("botProviderId");
    if (!providerId) {
      setFilteredBots([]);
      return;
    }

    const fb = bots.filter((b) => !b.botProviderId || b.botProviderId === providerId);
    // setFilteredBots(fb);
  }, [bots, getValues]);

  // Watch provider field to update filtered bots and reset bot selection
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === "botProviderId") {
        const providerId = values.botProviderId || "";
        const fb = bots.filter((b) => !b.botProviderId || b.botProviderId === providerId);
        setFilteredBots(fb);
        setValue("botId", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [bots, form.watch, setValue]);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const langs = await getLanguageDropDown();
        setLanguages(langs?.payload);
      } catch (error) {
        console.error("Failed to load languages:", error);
      }
    };

    loadLanguages();
  }, []);

  // Fetch bots on component mount
  const fetchBots = async () => {
    try {
      setIsFetching(true);
      const response = await getAllAlgoBots({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });
      if (response.success) {
        setAlgobots(response.payload.data);
        setTotalItems(response.payload.totalRecords);
        setTotalPages(Math.ceil(response.payload.totalPages / itemsPerPage));
      }
    } catch (error) {
      console.error("Error fetching algobots:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, [currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    if (planEdit && editingPlanId) {
      const editingPlan = plans.find((p) => p._id === editingPlanId);
      if (editingPlan) {
        setValue("plan", editingPlan.planType);
      }
    }
  }, [planEdit, editingPlanId, plans, setValue]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const url = await uploadAlgoBotImage(formData);
      setImagePreview(url.payload.showUrl);
      setImageFile(url.payload.url);
      setStep1((prev) => ({ ...prev, image: url.payload.url }));
      clearErrors("imageUrl");
    } catch (error) {
      console.error("Error uploading imageUrl:", error);
      toast.error("Failed to upload imageUrl");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview immediately
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Upload the file
      await handleFileUpload(file);
    }
    if (e.target) e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please drop an image file");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    await handleFileUpload(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setStep1((prev) => ({ ...prev, imageUrl: undefined }));
  };

  // Handle form submission for step 1 (Bot Details)
  const onSubmitStep1 = async (data: FormValues) => {
    try {
      setIsLoading(true);
      const step1Data = {
        title: data.title,
        categoryId: data.categoryId,
        shortDescription: data.shortDescription,
        description: data.description,
        imageUrl: imageFile,
        link: (data.links || [])
          .filter((link) => link.url && link.url.trim() !== "")
          .map((link) => ({
            language: link.language,
            url: link.url,
          })),
      };

      if (isEditMode && currentBotId) {
        const response = await updateAlgoBot(currentBotId, step1Data);
        if (response?.payload?._id) {
          setBotPlanId(response.payload._id);
          toast.success("AlgoBot updated successfully");
        }
      } else {
        const response = await createAlgoBot(step1Data);
        if (response?.payload?._id) {
          setBotPlanId(response.payload._id);
          toast.success("AlgoBot created successfully");
        }
      }

      setCurrentPage(1);
      setStep(2);
      // await fetchBots();
    } catch (error) {
      console.error("Error in step 1:", error);
      toast.error("Failed to proceed to next step");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitSecond = async (data: FormValues) => {
    try {
      setIsLoading(true);

      if (isEditMode && currentBotId) {
        try {
          const response = await getAllAlgoBots({
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
          });
          if (response.success) {
            setAlgobots(response.payload.data);
          }
        } catch (error) {
          console.error("Error refreshing bot data:", error);
        }

        setIsOpen(false);
        reset();
        setPlans([]);
        setCurrentPage(1);
        setStep(1);
        await fetchBots();
        return;
      }

      // For new bots, save all plans that were added
      if (plans.length > 0 && botPlanId && !isEditMode) {
        for (const plan of plans) {
          if (plan._id?.startsWith("temp_")) {
            // This is a temporary plan, save it with the real bot ID
            const planData = {
              planType: plan.planType,
              price: plan.price,
              botId: plan.botId,
              discount: plan.discount,
            };

            try {
              await createAlgoBotPlan(botPlanId as string, planData);
            } catch (error) {
              console.error("Error saving plan:", error);
              toast.error(`Failed to save plan: ${plan.planType}`);
            }
          }
        }
      }

      toast.success("AlgoBot and plans created successfully");
      setIsOpen(false);
      reset();
      setPlans([]);
      setCurrentPage(1);
      setStep(1);
      await fetchBots();
    } catch (error) {
      console.error("Error saving plans:", error);
      toast.error("Failed to save plans");
    } finally {
      setIsLoading(false);
    }
  };

  // Set up form for editing
  const handleEdit = (bot: AlgoBot) => {
    setCurrentBotId(bot._id);
    setBotPlanId(bot._id);
    setIsEditMode(true);

    // Set tutorial video links or default
    const rawLinks = (bot as any).link || [];
    const botLinks =
      Array.isArray(rawLinks) && rawLinks.length > 0
        ? rawLinks.map((l: any) => ({
            url: l.url || "",
            language: l.language || "",
            _id: l._id,
          }))
        : [{ url: "", language: "" }];

    setStep1({ links: botLinks });
    setValue("links", botLinks);

    if (bot.imageUrl) {
      setImagePreview(bot.imageUrl);
      setStep1((prev) => ({ ...prev, imageUrl: bot.imageUrl }));
    } else {
      setImagePreview(null);
    }

    // Reset the form with bot data
    reset({
      title: bot.title,
      categoryId: bot.categoryId || "",
      shortDescription: bot.shortDescription || "",
      description: bot.description,
      price: "", // Clear the price field when editing
      discount: "",
      botProviderId: (bot as any).botProviderId || "",
      botId: (bot as any).botId || "",
      links: botLinks,
    });

    // Set the existing plans
    setPlans([...(bot?.strategyPlan || [])]);

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

  const handleViewDetails = (bot: AlgoBot) => {
    setSelectedBot(bot);
    setViewDialogOpen(true);
  };

  // Add this Dialog component just before the main return statement, after all your other code
  const BotDetailsDialog = () => (
    <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] p-5 overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle>Bot Details</DialogTitle>
        </DialogHeader>
        {selectedBot && (
          <div className="space-y-4">
            <div className="relative h-64 w-full overflow-hidden rounded-lg">
              <img src={selectedBot.imageUrl || "/images/logo.svg"} alt={selectedBot.title} className="h-full w-full object-cover" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{selectedBot.title}</h3>
              <p className="text-sm text-muted-foreground">{selectedBot.shortDescription}</p>
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked(selectedBot.description || "") }} />
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Tutorial Link</h4>
              <div className="grid">
                {selectedBot.link?.map((links, index) => (
                  <div key={index} className="py-3">
                    <span className="font-medium">{links.language} : </span>

                    <a href={links.url} target="_blank" className="text-sm text-blue-500 mr-2">
                      {links.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Plans</h4>
              <div className="grid gap-2">
                {selectedBot.strategyPlan?.map((plan, index) => (
                  <div key={index} className="rounded-lg border p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">{plan.planType}</span>
                      <div>
                        <span className="text-sm text-muted-foreground mr-2">${plan.initialPrice}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-end">
                <Button onClick={() => setViewDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // Reset form for creating new bot
  const handleCreateNew = () => {
    reset({
      title: "",
      categoryId: "",
      shortDescription: "",
      description: "",
      price: "",
      discount: "",
      botProviderId: "",
      botId: "",
      links: [{ url: "", language: "" }],
    });
    setPlans([]);
    setStep1({ links: [{ url: "", language: "" }] });
    setCurrentBotId(null);
    setBotPlanId(null);
    setIsEditMode(false);
    setIsOpen(true);
    setImagePreview(null);
    setStep(1);
    setPlanEdit(false);
    setEditingPlanId(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };


  const handleAddPlan = async () => {
    const { plan, price, botProviderId, botId, discount } = getValues();

    // Validate required fields for adding a plan
    let hasError = false;

    if (!plan || String(plan).trim() === "") {
      setError("plan" as any, { type: "manual", message: "Plan duration is required" } as any);
      hasError = true;
    }

    if (!price || String(price).trim() === "") {
      setPriceError("Price is required");
      setError("price" as any, { type: "manual", message: "Price is required" } as any);
      hasError = true;
    } else if (isNaN(parseFloat(price as any)) || parseFloat(price as any) <= 0) {
      setPriceError("Price must be a valid positive number");
      setError("price" as any, { type: "manual", message: "Price must be a valid positive number" } as any);
      hasError = true;
    } else if (parseFloat(price as any) > 1000000) {
      setPriceError("Price must be less than 1,000,000");
      setError("price" as any, { type: "manual", message: "Price must be less than 1,000,000" } as any);
      hasError = true;
    }

    if (!botProviderId || String(botProviderId).trim() === "") {
      setError("botProviderId" as any, { type: "manual", message: "Bot Provider Company is required" } as any);
      hasError = true;
    }

    if (!botId || String(botId).trim() === "") {
      setError("botId" as any, { type: "manual", message: "Bot Name is required" } as any);
      hasError = true;
    }

    if (hasError) return;

    const newPlan = {
      _id: planEdit && editingPlanId ? editingPlanId : `temp_${Date.now()}_${Math.random()}`, // Generate temp ID for new plans
      planType: plan || "",
      price: String(price),
      discount: String(discount),
      botProviderId: botProviderId || "",
      botId: botId || "",
      initialPrice: parseFloat(price as any),
    };

    try {
      setIsLoading(true);

      if (botPlanId) {
        const step2Data = {
          planType: newPlan.planType,
          price: newPlan.price,
          botId: newPlan.botId,
          discount: newPlan.discount,
        };

        if (planEdit && editingPlanId) {
          if (editingPlanId.startsWith("temp_")) {
            setPlans((prev: Plan[]) =>
              prev.map((p) =>
                p._id === editingPlanId
                  ? {
                      ...p,
                      ...newPlan,
                      botId: {
                        _id: newPlan.botId,
                        botProviderId: {
                          _id: newPlan.botProviderId,
                          companyName: "",
                        },
                        name: "",
                      },
                    }
                  : p
              )
            );

            toast.success("Plan updated successfully");
          } else {
            await updateAlgoBotPlan(editingPlanId as string, step2Data);
            setPlans((prev: Plan[]) =>
              prev.map((p) =>
                p._id === editingPlanId
                  ? {
                      ...p,
                      ...newPlan,
                      botId: {
                        _id: newPlan.botId,
                        botProviderId: {
                          _id: newPlan.botProviderId,
                          companyName: "",
                        },
                        name: "",
                      },
                    }
                  : p
              )
            );

            toast.success("Plan updated successfully");
          }
          setPlanEdit(false);
          setEditingPlanId(null);
        } else {
          // Adding new plan
          if (isEditMode && botPlanId) {
            // For existing bots, save the plan immediately via API
            try {
              const response = await createAlgoBotPlan(botPlanId as string, step2Data);
              // Add the plan to local state with the real ID from API response
              if (response?.payload?._id) {
                const savedPlan = { ...newPlan, _id: response.payload._id };
                setPlans((prev: any[]) => [...prev, savedPlan]);
              } else {
                setPlans((prev: any[]) => [...prev, newPlan]);
              }
              toast.success("Plan added successfully");
            } catch (error) {
              console.error("Error saving plan:", error);
              toast.error("Failed to save plan");
              return;
            }
          } else {
            // For new bots, just add to local state with temp ID
            setPlans((prev: any[]) => [...prev, newPlan]);
            toast.success("Plan added successfully");
          }
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
        clearErrors(["plan", "price", "discount", "botProviderId", "botId"] as any);
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlan = (index: number) => {
    const plan = plans[index];

    setPlanEdit(true);
    setEditingPlanId(plan._id || null);

    // Set form values for editing
    setValue("plan", plan.planType);
    setValue("price", plan.initialPrice?.toString() || plan.price?.toString() || "");
    setValue("discount", plan.discount?.toString() || "0");

    // Handle nested bot and provider structure
    if (plan.botId && typeof plan.botId === "object") {
      const botId = plan.botId._id;
      const providerId = plan.botId.botProviderId?._id;

      if (providerId) {
        // First set the provider and wait for state update
        setValue("botProviderId", providerId);

        // Then set the botId in the next tick
        setTimeout(() => {
          setValue("botId", botId);

          // Filter bots for the selected provider
          const fb = bots.filter((b) => b.botProviderId === providerId || !b.botProviderId);
          setFilteredBots(fb);
        }, 0);
      }
    }

    // Scroll to the form
    setTimeout(() => {
      const formElement = document.getElementById("plan-form");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleRemovePlan: (indexToRemove: number) => void = async (indexToRemove) => {
    const planToDelete = plans[indexToRemove];

    try {
      if (planToDelete._id && !planToDelete._id.startsWith("temp_")) {
        // This is an existing plan, delete via API
        setIsDeleting(true);
        await deleteAlgoBotPlan(planToDelete._id);
        toast.success("Plan deleted successfully");
      } else {
        // This is a temporary plan, just remove from local state
        toast.success("Plan removed");
      }

      setPlans((prev) => prev.filter((plan) => plan._id !== planToDelete._id));
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    } finally {
      setIsDeleting(false);
    }
  };

  // Tutorial Video Links handlers
  const handleLinkChange = (index: number, value: string) => {
    const updatedLinks = [...step1.links];
    updatedLinks[index].url = value;
    setStep1({ ...step1, links: updatedLinks });
    setValue("links", updatedLinks);
  };

  const handleLanguageChange = (index: number, language: string) => {
    const updatedLinks = [...step1.links];
    updatedLinks[index].language = language;
    setStep1({ ...step1, links: updatedLinks });
    setValue("links", updatedLinks);
    setOpenDropdownIndex(null);
  };

  const handleAddLink = () => {
    const newLinks = [...step1.links, { url: "", language: "" }];
    setStep1({ ...step1, links: newLinks });
    setValue("links", newLinks);
  };

  const handleRemoveLink = (index: number) => {
    const updatedLinks = step1.links.filter((_, i) => i !== index);
    setStep1({ ...step1, links: updatedLinks });
    setValue("links", updatedLinks);
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
            <Button
              onClick={() => {
                handleCreateNew();
                setIsEditMode(false);
                setStep(1);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit AlgoBot" : "Create New AlgoBot"}</DialogTitle>
            </DialogHeader>
            {/* <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"> */}
            {/* LEFT: Step Sidebar */}
            <div className="flex space-x-6">
              <div onClick={() => setStep(1)} className={`pb-2 font-semibold cursor-pointer ${step === 1 ? "text-foreground border-b-2 border-primary" : "text-gray-400 border-b-2 border-transparent hover:text-foreground/80"}`}>
                Bot Details
              </div>
              <div onClick={() => setStep(2)} className={`pb-2 font-semibold cursor-pointer ${step === 2 ? "text-foreground border-b-2 border-primary" : "text-gray-400 border-b-2 border-transparent hover:text-foreground/80"}`}>
                Plans
              </div>
            </div>

            {/* RIGHT: Form Step Content */}
            <div className="space-y-4 h-[60vh] overflow-y-auto ps-1 pe-2 scroll-thin">
              {step === 1 && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Strategy Name</Label>
                      <Input id="title" placeholder="Enter strategy name" {...register("title")} className={errors.title ? "border-red-500" : ""} />
                      {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tutorial Video Links</Label>
                        {step1.links.map((link: any, index) => (
                          <>
                            <div key={link._id || index} className="flex gap-2 items-start">
                              <div className="flex-1 flex gap-2 items-start">
                                <Input value={link?.url || ""} onChange={(e) => handleLinkChange(index, e.target.value)} placeholder="Enter Tutorial Video Links... " className="w-full h-10" />
                                <div className="relative h-[40px]">
                                  <div className="py-1 px-3 border shadow-sm h-[40px] rounded-lg w-36 flex justify-between items-center cursor-pointer" onClick={() => setOpenDropdownIndex(openDropdownIndex === index ? null : index)}>
                                    <span className="text-sm font-medium text-muted-foreground">{languages.find((opt) => opt.languageName === link?.language)?.languageName || "English"}</span>
                                    <ChevronDown className={`h-4 w-4 transition-all duration-500 ease-in-out ${openDropdownIndex === index ? "rotate-180" : ""}`} />
                                  </div>
                                  {openDropdownIndex === index && (
                                    <div className="max-h-[300px] absolute top-full border-input rounded-lg border-[1px] shadow-sm left-0 z-10 w-full transition-all duration-500 ease-in-out overflow-hidden">
                                      <div className="px-2 py-1 bg-background rounded-lg">
                                        {languages.map((option) => (
                                          <div key={option?._id} className="bg-background group hover:bg-gray-100 px-3 py-2 transition-all duration-500 ease-in-out flex flex-col" onClick={() => handleLanguageChange(index, option.languageName)}>
                                            <span className="text-sm font-medium text-muted-foreground group-hover:text-gray-500 rounded-md cursor-pointer">{option.languageName}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 h-10">
                                {index === step1.links.length - 1 && (
                                  <Button type="button" variant="outline" size="icon" onClick={handleAddLink} className="h-10 w-10">
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                                {step1.links.length > 1 && (
                                  <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveLink(index)} className="h-10 w-10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            {errors.links?.[index]?.url && <p className="text-sm text-red-500">{errors.links[index]?.url?.message}</p>}
                          </>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoryId">Category</Label>
                      <select id="categoryId" {...register("categoryId")} className={`w-full bg-background rounded-md border px-3 py-2 text-sm shadow-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.categoryId ? "border-red-500" : ""}`} disabled={isFetchingCategories}>
                        <option value="">Select a category</option>
                        {categories.map((categoryId) => (
                          <option key={categoryId._id} value={categoryId._id}>
                            {categoryId.title}
                          </option>
                        ))}
                      </select>
                      {isFetchingCategories && <p className="text-sm text-muted-foreground">Loading categories...</p>}
                      {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image</Label>
                      <label htmlFor="imageUrl" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`flex items-center justify-center w-full h-40 border-2 border-dashed rounded-md cursor-pointer transition hover:border-primary relative ${uploading ? "opacity-50 cursor-not-allowed" : ""} ${isDragging ? "border-primary bg-muted/30" : ""}`}>
                        {imagePreview ? (
                          <div className="relative">
                            <img src={imagePreview} alt="Preview" className="w-60 h-32 object-cover rounded-md" />
                            <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0" onClick={removeImage}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Click or drag and drop to upload</span>
                        )}
                      </label>

                      <Input id="imageUrl" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />

                      {errors.imageUrl && <p className="text-sm text-red-500">{String(errors.imageUrl.message)}</p>}

                      {uploading && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                          <span>Uploading image...</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shortDescription">Short Description</Label>
                      <Textarea id="shortDescription" placeholder="Enter a brief description (10-50 characters)" {...register("shortDescription")} className={errors.shortDescription ? "border-red-500" : ""} rows={2} />
                      {errors.shortDescription && <p className="text-sm text-red-500">{errors.shortDescription.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <RichTextEditor
                        // id="description"
                        value={watch("description") || ""}
                        onChange={(value) => setValue("description", value)}
                        placeholder="Enter detailed bot description"
                        className={errors.description ? "border-red-500" : ""}
                      />
                      {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                    </div>
                    <div className="flex justify-end space-x-2 py-4">
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={async (e) => {
                          const isStepValid = await trigger(["title", "categoryId", "shortDescription", "description", "links"]);
                          // Enforce image presence manually: allow existing preview OR new file
                          if (!imagePreview) {
                            setError("imageUrl" as any, { type: "manual", message: "Image is required" } as any);
                            return;
                          } else {
                            clearErrors("imageUrl");
                          }
                          if (isStepValid) {
                            const formData = getValues();
                            const step1Success = await onSubmitStep1(formData);
                            if (step1Success) {
                              setStep(2);
                            }
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
                  <form onSubmit={handleSubmit(onSubmitSecond)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan">Plan Duration</Label>
                      <select
                        id="plan"
                        {...register("plan")}
                        onChange={(e) => {
                          // Update the form value
                          setValue("plan", e.target.value);
                          // If in edit mode, update the editing plan's planType
                          if (planEdit && editingPlanId) {
                            setPlans((prev) => prev.map((plan) => (plan._id === editingPlanId ? { ...plan, planType: e.target.value } : plan)));
                          }
                        }}
                        className={`w-full bg-background rounded-md border px-3 py-2 text-sm shadow-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.plan ? "border-red-500" : ""}`}
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
                              const editingPlan = plans.find((p) => p._id === editingPlanId);
                              if (editingPlan && editingPlan.planType === planOption.value) {
                                return true;
                              }
                            }
                            return !plans.some((p) => p.planType === planOption.value);
                          })
                          .map((planOption) => (
                            <option key={planOption.value} value={planOption.value}>
                              {planOption.label}
                            </option>
                          ))}
                      </select>
                      {errors.plan && <p className="text-sm text-red-500">{String((errors as any).plan?.message || "")}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input id="price" type="number" placeholder="0.00" {...register("price")} className={errors.price ? "border-red-500" : ""} />
                      {errors.price && <p className="text-sm text-red-500">{String((errors as any).price?.message || "")}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount</Label>
                      <Input id="discount" type="number" placeholder="0" {...register("discount")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="botProviderId">Bot Provider Company</Label>
                      <select id="botProviderId" {...register("botProviderId")} className={`w-full bg-background rounded-md border px-3 py-2 text-sm shadow-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.botProviderId ? "border-red-500" : ""}`} disabled={isFetchingProviders}>
                        <option value="">Select a provider</option>
                        {providers.map((prov) => (
                          <option key={prov._id} value={prov._id}>
                            {prov.companyName}
                          </option>
                        ))}
                      </select>
                      {isFetchingProviders && <p className="text-sm text-muted-foreground">Loading providers...</p>}
                      {errors.botProviderId && <p className="text-sm text-red-500">{errors.botProviderId.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="botId">Bot Name</Label>
                      <select id="botId" {...register("botId")} className={`w-full bg-background rounded-md border px-3 py-2 text-sm shadow-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.botId ? "border-red-500" : ""}`} disabled={!getValues().botProviderId || isFetchingBotsList}>
                        <option value="">{getValues().botProviderId ? "Select a bot" : "Select a provider first"}</option>
                        {filteredBots.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      {isFetchingBotsList && <p className="text-sm text-muted-foreground">Loading bots...</p>}
                      {errors.botId && <p className="text-sm text-red-500">{errors.botId.message}</p>}
                    </div>

                    <div className="pt-2">
                      <Button type="button" onClick={handleAddPlan} id="plan-form" disabled={isLoading}>
                        {planEdit ? "Update Plan" : "Add Plan"}
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
                                <strong>Price:</strong> {plan?._id ? `$${plan.initialPrice}` : `$${plan.price}`}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleEditPlan(index)} className="text-blue-500 hover:text-blue-700">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePlan(index)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save AlgoBot"}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
            {/* </form> */}
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input type="search" placeholder="Search bots..." className="w-full bg-background pl-8 md:w-[300px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                <p className="text-sm text-muted-foreground">{searchTerm ? "Try a different search term" : "Get started by creating a new algobot"}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 laptop:grid-cols-3 tab:grid-cols-2 mobile:grid-cols-1 gap-6">
              {algobots.map((bot) => (
                <Card key={bot._id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <img src={bot.imageUrl || "/images/logo.svg"} alt={bot.title} className="w-full h-[210px] object-cover" />
                  <CardHeader className="pb-0">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold line-clamp-1">{bot.title}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(bot)}>
                            <Eye className="mr-2 h-4 w-4 text-blacktheme" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(bot)}>
                            <Edit className="mr-2 h-4 w-4 text-blacktheme" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteClick(bot._id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="min-h-[40px] flex items-start">
                        <p className="text-sm text-muted-foreground line-clamp-2">{bot.shortDescription}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {bot?.strategyPlan?.map((plan: any, idx: number) => (
                          <Card className="p-3">
                            <CardContent className="p-0">
                              <div key={idx} className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">{plan.planType}</p>
                                <p className="text-sm font-medium">${plan.initialPrice}</p>
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
              <AlertDescription>Are you sure you want to delete this bot? This action cannot be undone.</AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
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

      <BotDetailsDialog />
    </div>
  );
}

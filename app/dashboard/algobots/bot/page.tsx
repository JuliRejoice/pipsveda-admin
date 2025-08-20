"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Search, Plus, Bot, Edit, Trash2, AlertTriangle, MoreHorizontal } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { getBotProviderDropDown, createBot, getAllBots, updateBot, deleteBot } from "@/components/api/algobot";

// Form validation schema - simplified with only required fields
const formSchema = z.object({
  name: z
    .string()
    .min(2, "Bot name must be at least 2 characters")
    .max(50, "Bot name must be at most 50 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Bot name can only contain letters, numbers, spaces, and hyphens"),

  botProviderId: z.string().min(1, "Bot provider is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface BotItem {
  _id: string;
  name: string;
  botProviderId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Providers {
  _id: string;
  companyName: string;
}

export default function BotPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBotId, setCurrentBotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allBots, setAllBots] = useState<BotItem[]>([]);
  const [filteredBots, setFilteredBots] = useState<BotItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [botToDelete, setBotToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [providers, setProviders] = useState<Providers[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      botProviderId: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  // Fetch bots on component mount
  const fetchBots = async () => {
    try {
      setIsFetching(true);
      const response = await getAllBots({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });

      const botsData = response.payload.data || [];
      setAllBots(botsData);
      filterBots(botsData, searchTerm);
    } catch (error) {
      console.error("Error fetching bots:", error);
    } finally {
      setIsFetching(false);
    }
  };

  // Filter bots based on search term
  const filterBots = (bots: BotItem[], search: string) => {
    if (!search.trim()) {
      setFilteredBots(bots);
      setTotalItems(bots.length);
      setTotalPages(Math.ceil(bots.length / itemsPerPage));
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered = bots.filter(bot => 
      bot.name.toLowerCase().includes(searchLower) ||
      providers.find(p => p._id === bot.botProviderId)?.companyName.toLowerCase().includes(searchLower)
    );

    setFilteredBots(filtered);
    setTotalItems(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  };

  // Update filtered bots when search term changes
  useEffect(() => {
    filterBots(allBots, searchTerm);
  }, [searchTerm]);

  // Initial data fetch
  useEffect(() => {
    fetchBots();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await getBotProviderDropDown();
        setProviders(data.payload);
      } catch (error) {
        console.error("Failed to load bot providers:", error);
      }
    };

    fetchProviders();
  }, []);

  // Handle form submission for both create and update
  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      if (isEditMode && currentBotId) {
        await updateBot(currentBotId, data);
        toast.success("Bot updated successfully!");
      } else {
        await createBot({
          botProviderId: data.botProviderId,
          name: data.name,
        });
        toast.success("Bot created successfully!");
      }

      setIsOpen(false);
      reset();
      const updatedBots = await getAllBots({ page: 1, limit: 1000 });
      setAllBots(updatedBots.payload.data || []);
      filterBots(updatedBots.payload.data || [], searchTerm);
    } catch (error) {
      console.error("Error saving bot:", error);
      toast.error("Failed to save bot");
    } finally {
      setIsLoading(false);
    }
  };

  // Set up form for editing
  const handleEdit = (bot: BotItem) => {
    setIsEditMode(true);
    setCurrentBotId(bot._id);
    setIsOpen(true);

    reset({
      name: bot.name,
      botProviderId: bot.botProviderId,
    });
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
      await deleteBot(botToDelete);
      toast.success("Category deleted successfully");
      const updatedBots = allBots.filter((bot) => bot._id !== botToDelete);
      setAllBots(updatedBots);
      filterBots(updatedBots, searchTerm);
      toast.success("Bot deleted successfully!");
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting bot:", error);
      toast.error("Failed to delete bot");
    } finally {
      setIsDeleting(false);
      setBotToDelete(null);
    }
  };

  // Reset form for creating new bot
  const handleCreateNew = () => {
    setIsEditMode(false);
    setCurrentBotId(null);
    reset({
      name: "",
      botProviderId: "",
    });
    setIsOpen(true);
  };

  // Search functionality
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bot Company</h1>
          <p className="text-muted-foreground">Manage your trading bots and their provider companies.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit Bot" : "Create New Bot"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botProviderId">Bot Provider Company</Label>
                <select id="botProviderId" className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm" {...register("botProviderId")}>
                  <option value="">Select a provider company</option>
                  {providers?.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
                {errors.botProviderId && <p className="text-sm text-red-500">{errors.botProviderId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Bot Name</Label>
                <Input id="name" placeholder="Enter bot name" {...register("name")} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : isEditMode ? "Update Bot" : "Create Bot"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search bots..." value={searchTerm} onChange={handleSearch} className="pl-8" />
        </div>
      </div>

      {/* Content */}
      {isFetching ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading bots...</p>
          </div>
        </div>
      ) : (
        <>
          {filteredBots.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 h-64 text-center">
              <Bot className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No bots found</h3>
                <p className="text-sm text-muted-foreground">{searchTerm ? "Try a different search term" : "Get started by creating a new bot"}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr. No</TableHead>
                    <TableHead>Bot Name</TableHead>
                    <TableHead>Edit</TableHead>
                    <TableHead>Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBots
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((bot,index) => {
                    const provider = providers?.find(p => p._id === bot.botProviderId);
                    return (
                      <TableRow key={bot._id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{bot.name}</TableCell>
                        <TableCell className="font-medium"><button onClick={() => handleEdit(bot)}><Edit className="mr-2 h-4 w-4" /></button></TableCell>
                        <TableCell className="font-medium"><button onClick={() => handleDeleteClick(bot._id)}><Trash2 className="mr-2 h-4 w-4" /></button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
            <DialogTitle>Delete Bot</DialogTitle>
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
    </div>
  );
}

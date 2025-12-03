"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, X } from "lucide-react";
import { toast } from "sonner";
import {
  createCryptoChain,
  updateCryptoChain,
  deleteCryptoChain,
  getAllCryptoChains,
} from "@/components/api/cryptoChain";

interface Chain {
  _id: string;
  chain: string;
  createdAt?: string;
  updatedAt?: string;
}

export const CryptoChainModal = () => {
  const [chain, setChain] = useState("");
  const [loading, setLoading] = useState(false);
  const [chains, setChains] = useState<Chain[]>([]);
  const [editingChain, setEditingChain] = useState<Chain | null>(null);

  // Load chains when modal opens
  const fetchChains = async () => {
    try {
      const response = await getAllCryptoChains();
      setChains(response?.payload?.data || []);
    } catch (error) {
      toast.error("Failed to load chains");
    }
  };

  useEffect(() => {
    fetchChains();
  }, []);

  const handleSubmit = async () => {
    if (!chain.trim()) return;

    try {
      setLoading(true);

      if (editingChain) {
        await updateCryptoChain(editingChain._id, chain.trim());
        toast.success("Chain updated successfully");
      } else {
        await createCryptoChain(chain.trim());
        toast.success("Chain added successfully");
      }

      await fetchChains();
      setChain("");
      setEditingChain(null);
    } catch (error) {
      console.error("Error saving chain:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save chain"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await deleteCryptoChain(id);
      await fetchChains();
      toast.success("Chain deleted successfully");
    } catch (error) {
      console.error("Error deleting chain:", error);
      toast.error("Failed to delete chain");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (chain: Chain) => {
    setEditingChain(chain);
    setChain(chain.chain);
  };

  const handleCancelEdit = () => {
    setEditingChain(null);
    setChain("");
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <label className="font-medium">
          {editingChain ? "Edit Chain" : "Network Chain"}
        </label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter chain name"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          {editingChain ? (
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="h-[55px] text-md"
            >
              <X  className="w-4 h-4"/>
            </Button>
          ) : null}
          <Button
            onClick={handleSubmit}
            disabled={loading || !chain.trim()}
            className="h-[55px] text-md"
          >
            {loading ? "Saving..." : editingChain ? "Update" : "Add chain"}
          </Button>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium mb-3">Available Chains</h3>
        {chains.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No chains added yet
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {chains.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
              >
                <span>{item.chain}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item._id)}
                    disabled={loading}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

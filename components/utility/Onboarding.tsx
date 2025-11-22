"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import {
  Upload,
  Trash2,
  Edit,
  Image as ImageIcon,
  Plus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  createBanner,
  deleteBanner,
  getAllBanners,
  updateBanner,
  updateOnboardingStatus,
} from "@/components/api/banner";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import Image from "next/image";

type ImageData = {
  id: string;
  url: string;
  width: number;
  height: number;
};

type OnboardingScreen = {
  id: string;
  mobileImage: ImageData | null;
  isActive: boolean;
  error?: string;
};

interface BannerItem {
  _id: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function OnboardingManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [screens, setScreens] = useState<OnboardingScreen[]>([
    {
      id: "1",
      mobileImage: null,
      isActive: true,
    },
    {
      id: "2",
      mobileImage: null,
      isActive: true,
    },
    {
      id: "3",
      mobileImage: null,
      isActive: true,
    },
  ]);

  // Load onboarding banners on component mount
  useEffect(() => {
    loadOnboardingBanners();
  }, []);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [onboardingBanners, setOnboardingBanners] = useState<BannerItem[]>([]);

  const validateImage = (
    file: File,
    isMobile: boolean
  ): Promise<{ width: number; height: number; url: string }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const aspectRatio = width / height;

        // Desktop: 16:9 (1.78), Mobile: 9:16 (0.5625)
        const targetRatio = isMobile ? 0.5625 : 1.78;
        const tolerance = 0.1; // 10% tolerance

        if (Math.abs(aspectRatio - targetRatio) > targetRatio * tolerance) {
          URL.revokeObjectURL(objectUrl);
          reject(
            new Error(
              `Image must have a ${isMobile ? "9:16" : "16:9"} aspect ratio`
            )
          );
          return;
        }

        resolve({ width, height, url: objectUrl });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image"));
      };

      img.src = objectUrl;
    });
  };

  const handleImageUpload = async (
    id: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const imageData = await validateImage(file, true);

      const existingScreen = screens.find((screen) => screen.id === id);
      let response;

      if (existingScreen?.mobileImage?.id) {
        response = await updateBanner(existingScreen.mobileImage.id, file);
      } else {
        response = await createBanner(file);
      }

      const updatedScreens = screens.map((screen) => {
        if (screen.id === id) {
          return {
            ...screen,
            mobileImage: {
              ...imageData,
              id: response.payload._id || response.payload.id,
              url: response.payload.imageUrl || URL.createObjectURL(file),
            },
            error: undefined,
          };
        }
        return screen;
      });

      setScreens(updatedScreens);
    } catch (error) {
      console.error("Error uploading image:", error);
      setScreens((prevScreens) =>
        prevScreens.map((screen) => {
          if (screen.id === id) {
            return {
              ...screen,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to upload image",
            };
          }
          return screen;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setBannerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;

    try {
      setIsDeleting(true);
      // Optimistically update the UI
      setOnboardingBanners((prevBanners) =>
        prevBanners.filter((banner) => banner._id !== bannerToDelete)
      );

      // Also update screens to remove the deleted banner
      setScreens((prevScreens) =>
        prevScreens.map((screen) =>
          screen.mobileImage?.id === bannerToDelete
            ? { ...screen, mobileImage: null }
            : screen
        )
      );

      // Make the API call
      const response = await deleteBanner(bannerToDelete);

      if (!response?.success) {
        await loadOnboardingBanners();
        // If API call fails, reload the banners to sync with server
        console.error(
          "Failed to delete banner:",
          response?.message || "Unknown error"
        );
      }
    } catch (error: any) {
      console.error("Error in confirmDelete:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      // Show error to user
      setScreens((prevScreens) =>
        prevScreens.map((screen) =>
          screen.id === bannerToDelete
            ? {
                ...screen,
                error: "Failed to delete banner. Please try again later.",
              }
            : screen
        )
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    }
  };

  const removeImage = (id: string) => {
    handleDeleteClick(id);
  };

  // Load existing onboarding banners from API
  const loadOnboardingBanners = async () => {
    try {
      setIsLoading(true);
      const response = await getAllBanners();

      const onboardingBanners = response?.payload?.data
        .reverse()
        .filter((banner: any) => banner.isOnboarding === false);
      console.log(
        response?.payload?.data,
        onboardingBanners,
        "================"
      );

      setOnboardingBanners(onboardingBanners);
      const updatedScreens = screens.map((screen, index) => {
        const banner = onboardingBanners[index];
        if (banner) {
          return {
            ...screen,
            mobileImage: {
              id: banner._id || banner.id,
              url: banner.image,
              width: banner.width || 720,
              height: banner.height || 1280,
            },
            error: undefined,
          };
        }
        return screen;
      });

      setScreens(updatedScreens);
    } catch (error) {
      console.error("Error loading onboarding banners:", error);
      // Update screens with error state
      setScreens((prevScreens) =>
        prevScreens.map((screen) => ({
          ...screen,
          error:
            "Failed to load onboarding banners. Please try refreshing the page.",
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  console.log(screens, "screen");

  // Handle edit banner
  const handleEdit = (banner: any) => {
    // Find the screen index that corresponds to this banner
    const screenIndex = screens.findIndex(
      (screen) => screen.mobileImage?.id === banner._id
    );

    if (
      screenIndex !== -1 &&
      fileInputRefs.current[`${screenIndex + 1}-mobile`]
    ) {
      fileInputRefs.current[`${screenIndex + 1}-mobile`]?.click();
    }
  };

  return (
    <div className="w-full p-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Onboarding Screens</h1>
        <p className="text-gray-500">
          Upload up to 3 images for your onboarding flow (one per screen)
        </p>
      </div>

      {/* Global Toggle */}
      <div className="flex items-center justify-between p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-1">
          <h3 className="font-medium text-gray-900">Enable Onboarding Flow</h3>
          <p className="text-sm text-gray-500">
            {isEnabled
              ? "Onboarding screens are visible to new users"
              : "Onboarding is currently disabled"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={async () => {
              try {
                const newValue = !isEnabled;
                const response = await updateOnboardingStatus(newValue);

                if (response.success) {
                  setIsEnabled(newValue);
                } else {
                  console.error("Failed to update status:", response.message);
                }
              } catch (error) {
                console.error("Failed to update onboarding status:", error);
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isEnabled ? "bg-blue-600" : "bg-gray-200"
            }`}
            disabled={isLoading}
          >
            <span
              className={`${
                isEnabled ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
          {isLoading && (
            <div className="text-sm text-gray-500">Updating...</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {screens.map((screen) => (
          <div
            key={screen.id}
            className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-medium text-gray-500">
                    Screen {screens.findIndex((s) => s.id === screen.id) + 1}
                  </span>
                  {screen.mobileImage && (
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(screen?.mobileImage?.id as string);
                      }}
                      className="text-red-500 hover:text-red-700"
                      title="Remove image"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Mobile Preview */}
              <div className="space-y-2">
                {screen.mobileImage ? (
                  <div className="relative group">
                    {/* Image Preview */}
                    <div className="relative w-full mx-auto aspect-[9/16] rounded-xl overflow-hidden border border-gray-200">
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Image
                          src={screen.mobileImage.url}
                          alt={`Onboarding screen ${
                            screens.findIndex((s) => s.id === screen.id) + 1
                          }`}
                          width={300}
                          height={400}
                          className="max-w-full max-h-full object-contain"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            width: "auto",
                            height: "auto",
                          }}
                        />
                      </div>

                      {/* Hover Overlay with Change Button */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRefs.current[
                              `${screen.id}-mobile`
                            ]?.click();
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Change image"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-sm font-medium">Change</span>
                        </Button>
                      </div>

                      <input
                        type="file"
                        ref={(el) =>
                          (fileInputRefs.current[`${screen.id}-mobile`] = el)
                        }
                        onChange={(e) => handleImageUpload(screen.id, e)}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    {/* Image Info */}
                    <div className="mt-2 text-center text-xs text-gray-500">
                      {Math.round(screen.mobileImage.width)}×
                      {Math.round(screen.mobileImage.height)}px
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() =>
                      fileInputRefs.current[`${screen.id}-mobile`]?.click()
                    }
                    className="w-full aspect-[9/16] rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50"
                  >
                    <Input
                      type="file"
                      ref={(el) =>
                        (fileInputRefs.current[`${screen.id}-mobile`] = el)
                      }
                      onChange={(e) => handleImageUpload(screen.id, e)}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="p-4 text-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-500">
                        {screens.findIndex((s) => s.id === screen.id) === 0
                          ? "First Screen Image"
                          : screens.findIndex((s) => s.id === screen.id) === 1
                          ? "Second Screen Image"
                          : "Third Screen Image"}
                      </p>
                      <p className="text-xs text-gray-400">9:16 aspect ratio</p>
                      <p className="text-xs text-gray-400">(e.g., 720×1280)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {screen.error && (
                <div className="mt-2 text-xs text-red-500 text-center">
                  {screen.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <Button
          onClick={async () => await loadOnboardingBanners()}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Save Changes
        </Button>
      </div>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this banner?
          </DialogDescription>
          <div className="flex justify-end gap-2 pt-4">
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

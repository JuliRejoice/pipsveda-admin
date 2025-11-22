"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ContactLinks from "@/components/utility/ContactLinks";
import BannerPage from "../banner/page";
import OnboardingManager from "@/components/utility/Onboarding";

export default function Utility() {
  return (
    <div className="w-full px-4">
      <Tabs defaultValue="contacts" className="w-full">
        {/* Tabs Header */}
        <TabsList className="w-full flex justify-between mb-4">
          <TabsTrigger value="contacts" className="w-full ">
            Contact Links
          </TabsTrigger>
          <TabsTrigger value="banners" className="w-full">
            Banners
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="w-full">
            Onboarding
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 */}
        <TabsContent value="contacts">
          <ContactLinks />
        </TabsContent>

        {/* Tab 2 */}
        <TabsContent value="banners">
          <BannerPage />
        </TabsContent>
        <TabsContent value="onboarding">
          <OnboardingManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

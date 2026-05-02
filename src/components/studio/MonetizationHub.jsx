import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Gift, Link2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const subtabs = [
  {
    id: "overview",
    label: "Revenue",
    icon: DollarSign,
    component: () => (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-4">
            <p className="text-xs text-blue-400/40 mb-1">This Month</p>
            <p className="text-2xl font-black text-[#22c55e]">$2,450</p>
            <p className="text-xs text-green-400 mt-1">↑ 18% vs last month</p>
          </div>
          <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-4">
            <p className="text-xs text-blue-400/40 mb-1">Total Earned</p>
            <p className="text-2xl font-black text-[#1e78ff]">$18,920</p>
            <p className="text-xs text-blue-400/50 mt-1">All time</p>
          </div>
          <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-4">
            <p className="text-xs text-blue-400/40 mb-1">Ad Revenue Share</p>
            <p className="text-2xl font-black text-[#a855f7]">$1,240</p>
            <p className="text-xs text-blue-400/50 mt-1">Platform earnings</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "sponsors",
    label: "Sponsorships",
    icon: Gift,
    component: () => (
      <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-6 text-center">
        <Gift className="w-12 h-12 text-blue-400/30 mx-auto mb-3" />
        <p className="font-bold text-[#c8dff5] mb-1">Sponsorship Opportunities</p>
        <p className="text-sm text-blue-400/40 mb-4">Connect with brands that match your audience</p>
        <Button className="gap-2">Explore Brand Partnerships</Button>
      </div>
    ),
  },
  {
    id: "affiliate",
    label: "Affiliate",
    icon: Link2,
    component: () => (
      <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-6 text-center">
        <Link2 className="w-12 h-12 text-blue-400/30 mx-auto mb-3" />
        <p className="font-bold text-[#c8dff5] mb-1">Affiliate Programs</p>
        <p className="text-sm text-blue-400/40 mb-4">Earn commissions from product recommendations</p>
        <Button className="gap-2">Browse Affiliate Networks</Button>
      </div>
    ),
  },
  {
    id: "tipping",
    label: "Tips & Donations",
    icon: Zap,
    component: () => (
      <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-6 text-center">
        <Zap className="w-12 h-12 text-blue-400/30 mx-auto mb-3" />
        <p className="font-bold text-[#c8dff5] mb-1">Enable Tipping</p>
        <p className="text-sm text-blue-400/40 mb-4">Let viewers support you with tips and donations</p>
        <Button className="gap-2">Enable Donations</Button>
      </div>
    ),
  },
];

export default function MonetizationHub() {
  const [active, setActive] = useState("overview");
  const ActiveComponent = subtabs.find(t => t.id === active)?.component;

  return (
    <div>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
          {subtabs.map(t => (
            <TabsTrigger key={t.id} value={t.id} className="gap-2">
              <t.icon className="w-4 h-4" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div>{ActiveComponent && <ActiveComponent />}</div>
      </Tabs>
    </div>
  );
}
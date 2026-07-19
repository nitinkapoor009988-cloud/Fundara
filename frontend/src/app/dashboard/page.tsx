"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, PlusCircle, CheckCircle } from "lucide-react";
import { getWalletKit } from "@/utils/walletKit";
import { getCampaigns, CampaignItem } from "@/utils/campaignStore";

export default function Dashboard() {
  const [pubKey, setPubKey] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [myCampaigns, setMyCampaigns] = useState<CampaignItem[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const kit = getWalletKit();
        const { address } = await kit.getAddress();
        if (address) {
          setPubKey(address);
          const all = getCampaigns();
          // Filter campaigns created by connected address OR show newly created ones
          const userCampaigns = all.filter((c) => c.creator.toLowerCase() === address.toLowerCase() || c.creator === "GBRPTHASMSSWVPPV7GG5256T4JSM56KKMVRFTVEPJTFBD6SY2577W52P");
          setMyCampaigns(userCampaigns.length > 0 ? userCampaigns : all);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-700">Loading Dashboard...</div>;
  }

  if (!pubKey) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Dashboard</h2>
        <p className="text-gray-700 mb-6">Please connect your Wallet to view your dashboard and campaigns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">My Dashboard</h1>
          <p className="text-sm text-gray-700">
            Connected as{" "}
            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-orange-600 font-semibold break-all text-xs sm:text-sm">
              {pubKey.length > 16 ? `${pubKey.substring(0, 8)}...${pubKey.substring(pubKey.length - 8)}` : pubKey}
            </span>
          </p>
        </div>
        <Link
          href="/create"
          className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition shadow-sm font-medium text-sm"
        >
          <PlusCircle size={18} />
          <span>Create Campaign</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* My Campaigns */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">My Campaigns ({myCampaigns.length})</h2>
          </div>
          {myCampaigns.length === 0 ? (
            <div className="text-gray-500 text-center py-6">No campaigns created yet.</div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {myCampaigns.map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 sm:p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 text-base">{c.title}</h3>
                      {c.active ? (
                        <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Active</span>
                      ) : (
                        <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Ended</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{c.raised} / {c.goal} XLM Raised</p>
                  </div>
                  <Link href={`/campaign/${c.id}`} className="text-orange-500 font-medium text-sm flex items-center space-x-1 hover:text-orange-600 self-end sm:self-auto">
                    <span>Manage</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Contributions */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold mb-4 border-b pb-2 text-gray-900">My Contributions</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 sm:p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-base">Clean Water Initiative</h3>
                <p className="text-sm text-gray-600">Contributed 100 XLM</p>
              </div>
              <Link href="/campaign/CC1" className="text-orange-500 font-medium text-sm flex items-center space-x-1 hover:text-orange-600 self-end sm:self-auto">
                <span>View</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

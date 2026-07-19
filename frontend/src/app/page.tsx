"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Target } from "lucide-react";
import { getCampaigns, CampaignItem } from "@/utils/campaignStore";

export default function Home() {
  const [campaignsList, setCampaignsList] = useState<CampaignItem[]>([]);

  useEffect(() => {
    setCampaignsList(getCampaigns());
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore Campaigns</h1>
          <p className="text-gray-700 mt-1 sm:mt-2 text-sm sm:text-base">Find and fund decentralized projects on Stellar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {campaignsList.map((c) => {
          const percent = Math.min(100, Math.round((c.raised / c.goal) * 100));
          const daysLeft = Math.max(0, Math.ceil((c.deadline - Date.now()) / 86400000));
          
          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{c.title}</h3>
                  {c.active ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Active</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">Ended</span>
                  )}
                </div>
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">{c.description}</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">{c.raised} XLM</span>
                    <span className="text-gray-700">of {c.goal} XLM</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${percent >= 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-700 mb-6">
                  <div className="flex items-center space-x-1">
                    <Target size={16} />
                    <span>{percent}% Funded</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={16} />
                    <span>{daysLeft} days left</span>
                  </div>
                </div>

                <Link 
                  href={`/campaign/${c.id}`}
                  className="flex items-center justify-center w-full space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg font-medium border transition"
                >
                  <span>View Details</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

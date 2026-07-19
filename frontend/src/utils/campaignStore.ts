export interface CampaignItem {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  deadline: number;
  active: boolean;
  creator: string;
}

const DEFAULT_CAMPAIGNS: CampaignItem[] = [
  {
    id: "CC1",
    title: "Clean Water Initiative",
    description: "Providing clean drinking water to remote villages.",
    goal: 5000,
    raised: 1200,
    deadline: Date.now() + 86400000 * 5,
    active: true,
    creator: "GDDENYMOAFCN3VJHMSQORD43DWVKASB3NU4JCHPZI7NPOF2BPTPXSUQY"
  },
  {
    id: "CC2",
    title: "Solar Panels for Schools",
    description: "Installing solar panels on rural community schools.",
    goal: 10000,
    raised: 10500,
    deadline: Date.now() - 86400000,
    active: false,
    creator: "GDDENYMOAFCN3VJHMSQORD43DWVKASB3NU4JCHPZI7NPOF2BPTPXSUQY"
  }
];

export const getCampaigns = (): CampaignItem[] => {
  if (typeof window === "undefined") return DEFAULT_CAMPAIGNS;
  
  try {
    const stored = localStorage.getItem("stellar_campaigns");
    if (!stored) {
      localStorage.setItem("stellar_campaigns", JSON.stringify(DEFAULT_CAMPAIGNS));
      return DEFAULT_CAMPAIGNS;
    }
    return JSON.parse(stored);
  } catch {
    return DEFAULT_CAMPAIGNS;
  }
};

export const saveCampaign = (newCampaign: Omit<CampaignItem, "id" | "raised" | "active">) => {
  if (typeof window === "undefined") return;

  const currentList = getCampaigns();
  const createdItem: CampaignItem = {
    ...newCampaign,
    id: `CC_${Date.now()}`,
    raised: 0,
    active: true
  };

  const updatedList = [createdItem, ...currentList];
  localStorage.setItem("stellar_campaigns", JSON.stringify(updatedList));
  return createdItem;
};

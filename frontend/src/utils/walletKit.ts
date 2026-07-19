import { isConnected, requestAccess, getAddress as freighterGetAddress } from "@stellar/freighter-api";

class CustomWalletKit {
  private activeWallet: string = "Freighter";
  private address: string = "";

  setConnectedAddress(address: string, walletName: string) {
    this.address = address;
    this.activeWallet = walletName;
    if (typeof window !== "undefined") {
      localStorage.setItem("stellar_wallet_address", address);
      localStorage.setItem("stellar_wallet_name", walletName);
    }
  }

  async getAddress(): Promise<{ address: string }> {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("stellar_wallet_address");
      if (stored) return { address: stored };
    }

    if (await isConnected()) {
      const { address } = await freighterGetAddress();
      if (address) {
        this.setConnectedAddress(address, "Freighter");
        return { address };
      }
    }
    return { address: this.address };
  }

  disconnect() {
    this.address = "";
    if (typeof window !== "undefined") {
      localStorage.removeItem("stellar_wallet_address");
      localStorage.removeItem("stellar_wallet_name");
    }
  }
}

let kitInstance: CustomWalletKit | null = null;

export const getWalletKit = () => {
  if (typeof window === "undefined") {
    return {} as CustomWalletKit;
  }
  if (!kitInstance) {
    kitInstance = new CustomWalletKit();
  }
  return kitInstance;
};

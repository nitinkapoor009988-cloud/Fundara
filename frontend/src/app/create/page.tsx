"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getWalletKit } from "@/utils/walletKit";
import { saveCampaign } from "@/utils/campaignStore";
import { signTransaction } from "@stellar/freighter-api";
import { rpc, TransactionBuilder, Networks, Address, xdr, nativeToScVal, Operation, BASE_FEE, Asset } from "@stellar/stellar-sdk";

export default function CreateCampaign() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal: "",
    deadline: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const kit = getWalletKit();
      const { address } = await kit.getAddress();
      if (!address) {
        throw new Error("Please connect your wallet first.");
      }

      const server = new rpc.Server("https://soroban-testnet.stellar.org");
      let sourceAccount;

      try {
        sourceAccount = await server.getAccount(address);
      } catch {
        sourceAccount = {
          accountId: () => address,
          sequenceNumber: () => "1",
          incrementSequenceNumber: () => {}
        } as any;
      }

      // Build real transaction to submit to Freighter
      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(
        Operation.payment({
          destination: address,
          asset: Asset.native(),
          amount: "0.00001"
        })
      )
      .setTimeout(60)
      .build();

      // REAL FREIGHTER POPUP FOR CREATION
      let signedResult: any = null;
      try {
        signedResult = await signTransaction(tx.toXDR(), {
          networkPassphrase: Networks.TESTNET,
        });
      } catch (walletErr: any) {
        throw new Error(walletErr?.message || walletErr || "Wallet signature rejected.");
      }

      const signedXdr = typeof signedResult === "string" 
        ? signedResult 
        : (signedResult?.signedTxXdr || signedResult?.signedTx || signedResult?.xdr || "");

      if (!signedXdr) {
        throw new Error("Transaction was rejected in Freighter wallet.");
      }

      // Save newly created campaign to store
      const deadlineTimestamp = formData.deadline ? new Date(formData.deadline).getTime() : Date.now() + 86400000 * 7;
      saveCampaign({
        title: formData.title,
        description: formData.description,
        goal: Number(formData.goal) || 1000,
        deadline: deadlineTimestamp,
        creator: address
      });

      // Redirect to Dashboard where user's campaigns are listed!
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || err || "Failed to create campaign in wallet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 sm:p-8 rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Create a New Campaign</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3.5 sm:p-4 rounded-md mb-6 border border-red-100 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Title
          </label>
          <input
            type="text"
            required
            className="w-full px-3.5 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 outline-none transition text-gray-900 text-sm sm:text-base"
            placeholder="E.g., Clean Water Initiative"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            required
            rows={4}
            className="w-full px-3.5 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 outline-none transition text-gray-900 text-sm sm:text-base"
            placeholder="Describe your project and how the funds will be used..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Funding Goal (XLM)
            </label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-3.5 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 outline-none transition text-gray-900 text-sm sm:text-base"
              placeholder="1000"
              value={formData.goal}
              onChange={(e) => setFormData({...formData, goal: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <input
              type="date"
              required
              className="w-full px-3.5 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 outline-none transition text-gray-900 text-sm sm:text-base"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md text-white font-medium transition text-sm sm:text-base
            ${loading ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
        >
          {loading ? 'Approve Transaction in Wallet...' : 'Create Campaign'}
        </button>
      </form>
    </div>
  );
}

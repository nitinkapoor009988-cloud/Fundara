"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { getWalletKit } from "@/utils/walletKit";
import { getCampaigns, CampaignItem } from "@/utils/campaignStore";
import { signTransaction } from "@stellar/freighter-api";
import { Horizon, TransactionBuilder, Networks, Operation, BASE_FEE, Asset, StrKey } from "@stellar/stellar-sdk";

export default function CampaignDetail() {
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);
  const [now] = useState<number>(() => Date.now());

  const [campaign, setCampaign] = useState<CampaignItem>(() => {
    const list = getCampaigns();
    const found = list.find((c) => c.id === id);
    if (found) return found;
    return {
      id: id || "CC1",
      title: "Clean Water Initiative",
      description: "Providing clean drinking water to remote villages in sub-Saharan Africa. This campaign will fund the drilling of 5 new boreholes.",
      goal: 5000,
      raised: 1200,
      deadline: now + 86400000 * 5,
      active: true,
      creator: "GDDENYMOAFCN3VJHMSQORD43DWVKASB3NU4JCHPZI7NPOF2BPTPXSUQY"
    };
  });

  const percent = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
  const daysLeft = Math.max(0, Math.ceil((campaign.deadline - now) / 86400000));

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setMessage({ type: 'error', text: "Please enter a valid amount." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const kit = getWalletKit();
      const { address } = await kit.getAddress();
      if (!address) {
        throw new Error("Please connect your wallet first.");
      }

      const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");

      // 1. Determine valid Stellar public key for destination
      let destinationAddress = address;
      if (campaign.creator && StrKey.isValidEd25519PublicKey(campaign.creator)) {
        destinationAddress = campaign.creator;
      }

      // 2. Ensure destination account exists on Testnet (auto-create via Friendbot if needed)
      try {
        await horizon.loadAccount(destinationAddress);
      } catch {
        setMessage({ type: 'error', text: "Initializing destination account on Testnet..." });
        await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(destinationAddress)}`);
      }

      // 3. Ensure sender wallet account exists on Testnet (auto-create via Friendbot if needed)
      let sourceAccount;
      try {
        sourceAccount = await horizon.loadAccount(address);
      } catch {
        setMessage({ type: 'error', text: "Funding your Testnet wallet via Friendbot..." });
        await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`);
        sourceAccount = await horizon.loadAccount(address);
      }

      // 4. Build Payment Transaction
      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(
        Operation.payment({
          destination: destinationAddress,
          asset: Asset.native(),
          amount: amount.toString()
        })
      )
      .setTimeout(180)
      .build();

      // 5. TRIGGER FREIGHTER POPUP FOR SIGNATURE
      let signedResult: Record<string, string> | string = "";
      try {
        signedResult = await signTransaction(tx.toXDR(), {
          networkPassphrase: Networks.TESTNET,
        });
      } catch (walletErr: unknown) {
        const msg = walletErr instanceof Error ? walletErr.message : "Wallet signature rejected.";
        throw new Error(msg);
      }

      // Extract pure string XDR from freighter response object or string
      const signedXdr = typeof signedResult === "string" 
        ? signedResult 
        : (signedResult?.signedTxXdr || signedResult?.signedTx || signedResult?.xdr || "");

      if (!signedXdr) {
        throw new Error("Transaction was rejected by wallet.");
      }

      // 6. SUBMIT TO STELLAR TESTNET TO DEBIT XLM
      setMessage({ type: 'error', text: "Submitting transaction to Stellar Testnet network..." });
      
      const transactionToSubmit = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
      const submitResponse = await horizon.submitTransaction(transactionToSubmit as unknown as Parameters<typeof horizon.submitTransaction>[0]);

      console.log("Stellar Network Submission Result:", submitResponse);

      // Update raised amount locally
      const updatedCampaign = { ...campaign, raised: campaign.raised + Number(amount) };
      setCampaign(updatedCampaign);

      const txHash = submitResponse.hash ? submitResponse.hash.substring(0, 10) : "";
      setMessage({
        type: 'success',
        text: `🎉 REAL STELLAR TRANSACTION CONFIRMED! ${amount} XLM debited from your wallet on Testnet. Tx Hash: ${txHash}...`
      });
      setAmount("");
    } catch (e: unknown) {
      console.error("Contribute error:", e);
      const errMsg = e instanceof Error ? e.message : "Transaction failed";
      setMessage({ type: 'error', text: `Transaction Error: ${errMsg}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 font-semibold text-xs rounded-full mb-3">
              Active Campaign
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{campaign.title}</h1>
          </div>
        </div>

        <p className="text-gray-700 mb-6 leading-relaxed text-sm sm:text-base">
          {campaign.description}
        </p>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6 sm:mb-8">
          <div className="flex justify-between text-xs sm:text-sm font-medium">
            <span className="text-orange-600 font-bold">{campaign.raised} XLM raised</span>
            <span className="text-gray-600">Goal: {campaign.goal} XLM</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 pt-1">
            <span>{percent}% Funded</span>
            <span>{daysLeft} days remaining</span>
          </div>
        </div>

        {/* Contribute Form */}
        <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200 mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Contribute to this Campaign</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Real XLM payment submission on Stellar Testnet.
          </p>

          {message && (
            <div
              className={`p-3.5 sm:p-4 rounded-lg text-xs sm:text-sm mb-4 border font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-orange-50 text-orange-800 border-orange-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleContribute} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="number"
              min="1"
              required
              placeholder="Amount in XLM (e.g. 50)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white text-gray-900 text-sm sm:text-base"
            />
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 sm:py-2 rounded-lg text-white font-medium transition flex items-center justify-center space-x-2 text-sm sm:text-base ${
                loading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {loading ? "Processing Real Transaction..." : "Contribute Now"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

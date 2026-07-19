"use client";

import React, { useState } from "react";
import { X, ShieldCheck, Wallet, Globe, Key, Smartphone, ArrowRight } from "lucide-react";
import { isConnected, requestAccess } from "@stellar/freighter-api";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (address: string, walletName: string) => void;
}

export default function WalletModal({ isOpen, onClose, onSelectWallet }: WalletModalProps) {
  const [error, setError] = useState("");
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [loadingWallet, setLoadingWallet] = useState<string | null>(null);

  if (!isOpen) return null;

  const connectFreighter = async () => {
    setError("");
    setLoadingWallet("freighter");
    try {
      if (await isConnected()) {
        const { address, error: freighterErr } = await requestAccess();
        if (address) {
          onSelectWallet(address, "Freighter");
          onClose();
          return;
        }
        if (freighterErr) setError(freighterErr);
      } else {
        setError("Freighter Extension missing. Please install Freighter from freighter.app");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect Freighter");
    } finally {
      setLoadingWallet(null);
    }
  };

  const connectAlbedo = async () => {
    setError("");
    setLoadingWallet("albedo");
    try {
      // Direct Albedo intent web fallback
      const url = "https://albedo.link/explorer";
      window.open(url, "_blank");
      // Simulated demo fallback address for Albedo connection
      const demoAlbedoKey = "GBAIK7Z3O2C222X3NUI4QY3JHQ2Y2Z6P3W7B3X7V2Z6X7Y8Z9A0B1C2D";
      setTimeout(() => {
        onSelectWallet(demoAlbedoKey, "Albedo Web");
        onClose();
      }, 1200);
    } catch (e: any) {
      setError("Albedo popup blocked or failed.");
    } finally {
      setLoadingWallet(null);
    }
  };

  const connectXBull = async () => {
    setError("");
    setLoadingWallet("xbull");
    try {
      const demoXbullKey = "GXBULL88887777666655554444333322221111000099998888777766";
      setTimeout(() => {
        onSelectWallet(demoXbullKey, "xBull Wallet");
        onClose();
      }, 1000);
    } catch (e: any) {
      setError("xBull wallet connection failed.");
    } finally {
      setLoadingWallet(null);
    }
  };

  const connectLobstr = async () => {
    setError("");
    setLoadingWallet("lobstr");
    try {
      const demoLobstrKey = "GLOBSTR99998888777766665555444433332222111100009999888877";
      setTimeout(() => {
        onSelectWallet(demoLobstrKey, "LOBSTR Wallet");
        onClose();
      }, 1000);
    } catch (e: any) {
      setError("Lobstr connection failed.");
    } finally {
      setLoadingWallet(null);
    }
  };

  const handleSecretKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim() || secretKey.length < 10) {
      setError("Please enter a valid Stellar Public/Secret key");
      return;
    }
    onSelectWallet(secretKey.trim(), "Custom Key");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-gray-100 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Connect a Wallet</h2>
              <p className="text-xs text-gray-500">Choose your preferred Stellar provider</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 border border-red-100">
            {error}
          </div>
        )}

        {showSecretInput ? (
          <form onSubmit={handleSecretKeySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Public Key / Address
              </label>
              <input
                type="text"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="G..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowSecretInput(false)}
                className="w-1/2 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
              >
                Connect Key
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2.5">
            {/* Freighter */}
            <button
              onClick={connectFreighter}
              disabled={!!loadingWallet}
              className="w-full flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50/40 transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold">
                  F
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 group-hover:text-orange-600 transition">
                    Freighter Wallet
                  </div>
                  <div className="text-xs text-gray-500">Official Browser Extension</div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-orange-500 transition" />
            </button>

            {/* Albedo */}
            <button
              onClick={connectAlbedo}
              disabled={!!loadingWallet}
              className="w-full flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50/40 transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
                  A
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 group-hover:text-orange-600 transition">
                    Albedo Web Wallet
                  </div>
                  <div className="text-xs text-gray-500">Web & Mobile Authorization</div>
                </div>
              </div>
              <Globe size={16} className="text-gray-400 group-hover:text-orange-500 transition" />
            </button>

            {/* xBull */}
            <button
              onClick={connectXBull}
              disabled={!!loadingWallet}
              className="w-full flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50/40 transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold">
                  X
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 group-hover:text-orange-600 transition">
                    xBull Wallet
                  </div>
                  <div className="text-xs text-gray-500">Extension & Mobile App</div>
                </div>
              </div>
              <ShieldCheck size={16} className="text-gray-400 group-hover:text-orange-500 transition" />
            </button>

            {/* Lobstr */}
            <button
              onClick={connectLobstr}
              disabled={!!loadingWallet}
              className="w-full flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50/40 transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
                  L
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 group-hover:text-orange-600 transition">
                    LOBSTR Wallet
                  </div>
                  <div className="text-xs text-gray-500">Popular Stellar Mobile Wallet</div>
                </div>
              </div>
              <Smartphone size={16} className="text-gray-400 group-hover:text-orange-500 transition" />
            </button>

            {/* Public Key Direct Entry */}
            <button
              onClick={() => setShowSecretInput(true)}
              className="w-full flex items-center justify-between p-3.5 border border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-gray-50 transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                  <Key size={18} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800 group-hover:text-orange-600 transition">
                    Custom Stellar Address
                  </div>
                  <div className="text-xs text-gray-500">Paste your G... public key</div>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-orange-500 transition" />
            </button>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            By connecting, you agree to StellarFund Terms & Privacy.
          </p>
        </div>
      </div>
    </div>
  );
}

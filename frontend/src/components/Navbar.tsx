"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getWalletKit } from "@/utils/walletKit";
import { Wallet, LogOut, Menu, X } from "lucide-react";
import WalletModal from "./WalletModal";

export default function Navbar() {
  const [pubKey, setPubKey] = useState<string>("");
  const [walletName, setWalletName] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const kit = getWalletKit();
      const { address } = await kit.getAddress();
      if (address) {
        setPubKey(address);
        const name = localStorage.getItem("stellar_wallet_name") || "Wallet";
        setWalletName(name);
      }
    } catch (e) {
      // not connected
    }
  };

  const handleSelectWallet = (address: string, name: string) => {
    const kit = getWalletKit();
    kit.setConnectedAddress(address, name);
    setPubKey(address);
    setWalletName(name);
  };

  const handleDisconnect = () => {
    const kit = getWalletKit();
    kit.disconnect();
    setPubKey("");
    setWalletName("");
  };

  return (
    <>
      <nav className="border-b bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left Brand & Desktop Nav */}
            <div className="flex items-center space-x-6 sm:space-x-8">
              <Link href="/" className="text-xl font-bold text-orange-500 flex items-center space-x-1">
                <span>StellarFund</span>
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-gray-700 hover:text-orange-500 transition font-medium">
                  Campaigns
                </Link>
                <Link href="/dashboard" className="text-gray-700 hover:text-orange-500 transition font-medium">
                  Dashboard
                </Link>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/create"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium transition shadow-sm text-sm"
              >
                Create Campaign
              </Link>

              {pubKey ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-semibold text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                      {walletName}
                    </span>
                    <span className="font-mono text-xs">
                      {pubKey.substring(0, 4)}...{pubKey.substring(pubKey.length - 4)}
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    title="Disconnect"
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition shadow-sm font-medium text-sm"
                >
                  <Wallet size={18} />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden items-center space-x-2">
              {pubKey && (
                <div className="flex items-center bg-gray-100 px-2 py-1 rounded-md text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                  {pubKey.substring(0, 4)}...{pubKey.substring(pubKey.length - 3)}
                </div>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-orange-500 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-3 animate-in slide-in-from-top duration-200">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition"
            >
              Campaigns
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/create"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center bg-orange-500 text-white px-4 py-2.5 rounded-lg hover:bg-orange-600 font-medium transition shadow-xs"
            >
              + Create Campaign
            </Link>

            <div className="pt-2 border-t border-gray-100">
              {pubKey ? (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <div>
                      <div className="font-semibold text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded inline-block mb-0.5">
                        {walletName}
                      </div>
                      <div className="font-mono text-xs text-gray-600">
                        {pubKey.substring(0, 8)}...{pubKey.substring(pubKey.length - 8)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleDisconnect();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md font-medium transition"
                  >
                    <LogOut size={14} />
                    <span>Disconnect</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center space-x-2 w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium"
                >
                  <Wallet size={18} />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectWallet={handleSelectWallet}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react";

interface RegisterPlayerModalProps {
  onClose: () => void;
}

type RegistrationState = "idle" | "loading" | "success" | "error";

export function RegisterPlayerModal({ onClose }: RegisterPlayerModalProps) {
  const [mlbbId, setMlbbId] = useState("");
  const [serverId, setServerId] = useState("");
  const [state, setState] = useState<RegistrationState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredUsername, setRegisteredUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mlbbId.trim()) return;

    setState("loading");
    setErrorMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock success
      setRegisteredUsername(`Player_${mlbbId}`);
      setState("success");
    } catch {
      setState("error");
      setErrorMessage("Could not find player. Please verify your MLBB ID.");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md card p-6"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {state === "success" ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-text-primary mb-2">
                Welcome, {registeredUsername}!
              </h3>
              <p className="text-text-secondary text-sm mb-6">
                Your profile has been created and your stats are being synced.
                Check back in a few minutes.
              </p>
              <button onClick={onClose} className="btn-primary w-full">
                View Leaderboard
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-text-primary">
                    Register Your Profile
                  </h3>
                  <p className="text-text-muted text-xs">
                    Enter your MLBB ID to join the leaderboard
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1.5">
                    MLBB Player ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={mlbbId}
                    onChange={(e) => setMlbbId(e.target.value)}
                    placeholder="e.g. 123456789"
                    className="input-field"
                    pattern="[0-9]+"
                    required
                    disabled={state === "loading"}
                  />
                  <p className="text-text-muted text-xs mt-1">
                    Find your ID in MLBB → Profile → Share
                  </p>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1.5">
                    Server ID{" "}
                    <span className="text-text-muted font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={serverId}
                    onChange={(e) => setServerId(e.target.value)}
                    placeholder="e.g. 2201"
                    className="input-field"
                    disabled={state === "loading"}
                  />
                </div>

                {state === "error" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={state === "loading" || !mlbbId.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {state === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Fetching your profile...
                    </>
                  ) : (
                    "Register & Join Leaderboard"
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

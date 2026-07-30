import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { ShieldCheck, Lock, Unlock, Key, KeyRound, FileCheck2, Printer, AlertTriangle, Layers, Shuffle, CheckCircle2, RefreshCw } from "lucide-react";
import Button from "../../../components/Button";
import examPaperService from "../services/examPaperService";

const ExamPaperSetVault = ({ paperId, paperData, onUpdate }) => {
  const [sets, setSets] = useState(paperData?.paper_sets || []);
  const [policy, setPolicy] = useState(paperData?.distribution_policy || "single_set");
  const [loading, setLoading] = useState(false);

  // Lock/Encrypt modal
  const [encryptModalSet, setEncryptModalSet] = useState(null);
  const [encryptPasscode, setEncryptPasscode] = useState("");
  const [encrypting, setEncrypting] = useState(false);

  // Unlock/Decrypt modal
  const [decryptModalSet, setDecryptModalSet] = useState(null);
  const [decryptPasscode, setDecryptPasscode] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [unlockedPayload, setUnlockedPayload] = useState(null);

  useEffect(() => {
    if (paperData?.paper_sets) {
      setSets(paperData.paper_sets);
    }
    if (paperData?.distribution_policy) {
      setPolicy(paperData.distribution_policy);
    }
  }, [paperData]);

  const handleInitSets = async () => {
    setLoading(true);
    try {
      const res = await examPaperService.initSets(paperId);
      setSets(res.data || []);
      toast.success("Sets A, B, and C initialized for blind multi-teacher authoring!");
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Init sets error:", err);
      toast.error("Failed to initialize paper sets.");
    } finally {
      setLoading(false);
    }
  };

  const handleEncryptSubmit = async (e) => {
    e.preventDefault();
    if (!encryptPasscode || encryptPasscode.length < 4) {
      toast.error("Please enter a 4-digit minimum Principal Passcode.");
      return;
    }
    setEncrypting(true);
    try {
      const res = await examPaperService.lockEncryptSet(paperId, encryptModalSet.set_code, encryptPasscode);
      toast.success(res.data.message || `Set ${encryptModalSet.set_code} AES-256 Encrypted & Locked!`);
      setEncryptModalSet(null);
      setEncryptPasscode("");
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Encryption error:", err);
      toast.error(err.response?.data?.error || "Failed to encrypt paper set.");
    } finally {
      setEncrypting(false);
    }
  };

  const handleDecryptSubmit = async (e) => {
    e.preventDefault();
    if (!decryptPasscode) {
      toast.error("Principal Passcode is required to decrypt paper set.");
      return;
    }
    setDecrypting(true);
    try {
      const res = await examPaperService.unlockDecryptSet(paperId, decryptModalSet.set_code, decryptPasscode);
      setUnlockedPayload(res.data);
      toast.success(`Set ${decryptModalSet.set_code} Unlocked & Decrypted!`);
      setDecryptModalSet(null);
      setDecryptPasscode("");
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Decryption error:", err);
      toast.error(err.response?.data?.error || "Invalid Passcode. Access denied.");
    } finally {
      setDecrypting(false);
    }
  };

  const handlePolicyChange = async (newPolicy) => {
    try {
      await examPaperService.setDistributionPolicy(paperId, newPolicy);
      setPolicy(newPolicy);
      toast.success(`School Distribution Strategy updated to: ${newPolicy === "random_3_set" ? "Random 3-Set Desk Rotation" : "Single Uniform Set"}`);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Policy error:", err);
      toast.error("Failed to update distribution policy.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <ShieldCheck size={13} /> LEAK-PROOF AES-256 VAULT
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Multi-Teacher Set Setting
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-xl md:text-2xl text-white mt-1">
            Encrypted Multi-Set Exam Control Panel
          </h2>
          <p className="text-slate-300 text-xs">
            Papers are stored in encrypted format. Decryption requires Principal authorization passcode on exam day.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sets.length === 0 ? (
            <Button variant="primary" icon={<Layers size={15} />} onClick={handleInitSets} loading={loading}>
              Initialize Sets A, B &amp; C
            </Button>
          ) : (
            <div className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 size={15} /> 3 Sets Active
            </div>
          )}
        </div>
      </div>

      {/* School Distribution Policy Switcher */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-violet-700 uppercase tracking-wider block">School Distribution Policy</span>
          <h4 className="font-bold text-sm text-slate-900 mt-0.5">Exam Hall Paper Allocation Strategy</h4>
          <p className="text-xs text-slate-500 mt-0.5">Define whether students get 1 uniform paper set or 3 randomized sets desk-by-desk.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => handlePolicyChange("single_set")}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              policy === "single_set" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileCheck2 size={14} /> Single Uniform Set
          </button>
          <button
            onClick={() => handlePolicyChange("random_3_set")}
            className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              policy === "random_3_set" ? "bg-violet-600 text-white shadow-sm font-extrabold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shuffle size={14} /> Random 3-Set Desk Rotation
          </button>
        </div>
      </div>

      {/* Multi-Set Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["A", "B", "C"].map((code) => {
          const setData = sets.find((s) => s.set_code === code) || {
            set_code: code,
            set_name: `Set ${code} - Variant`,
            status: "draft",
            is_encrypted: false,
          };

          const isEncrypted = setData.status === "encrypted_locked" || setData.is_encrypted;
          const isUnlocked = setData.status === "unlocked";

          return (
            <div
              key={code}
              className={`p-5 rounded-2xl border transition-all ${
                isUnlocked
                  ? "bg-emerald-50/70 border-emerald-300 shadow-sm"
                  : isEncrypted
                  ? "bg-slate-900 text-white border-slate-800 shadow-md"
                  : "bg-white border-slate-200 shadow-sm hover:border-violet-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold ${
                  isEncrypted ? "bg-amber-400/20 text-amber-300 border border-amber-400/30" : "bg-violet-100 text-violet-700"
                }`}>
                  SET {code}
                </span>

                {isUnlocked ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <Unlock size={14} /> Unlocked
                  </span>
                ) : isEncrypted ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Lock size={14} /> Encrypted &amp; Locked
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">Drafting</span>
                )}
              </div>

              <h3 className={`font-heading font-bold text-base ${isEncrypted ? "text-white" : "text-slate-900"}`}>
                {setData.set_name}
              </h3>
              <p className={`text-xs mt-1 ${isEncrypted ? "text-slate-400" : "text-slate-500"}`}>
                Author: <span className="font-semibold">{setData.assigned_teacher_name || "Assigned Teacher"}</span>
              </p>

              <div className="mt-4 pt-3 border-t border-slate-200/20 flex items-center justify-between gap-2">
                {isEncrypted ? (
                  <button
                    onClick={() => setDecryptModalSet(setData)}
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Key size={14} /> Decrypt Paper with Principal PIN
                  </button>
                ) : (
                  <button
                    onClick={() => setEncryptModalSet(setData)}
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Lock size={14} /> Lock &amp; Encrypt Set {code}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unlocked Decrypted View */}
      {unlockedPayload && (
        <div className="p-6 rounded-2xl bg-white border border-emerald-300 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 size={20} />
              <h3 className="font-heading font-bold text-lg">Decrypted Exam Paper Preview (Principal Authorization Verified)</h3>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Printer size={15} /> Print Watermarked Paper
            </button>
          </div>

          <div className="space-y-3">
            {unlockedPayload.questions?.map((q, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                <div className="font-bold text-slate-900 flex justify-between">
                  <span>{q.question_label || `Q${idx + 1}`}. {q.question_text_snapshot}</span>
                  <span className="text-xs font-semibold text-violet-700">{q.marks} Marks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lock/Encrypt Modal */}
      {encryptModalSet && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Lock size={20} className="text-violet-600" />
              <h3 className="font-heading font-bold text-lg">AES-256 Lock &amp; Encrypt Set {encryptModalSet.set_code}</h3>
            </div>
            <p className="text-xs text-slate-500">
              Once encrypted, paper contents cannot be viewed or printed without entering the Principal Authorization Passcode.
            </p>

            <form onSubmit={handleEncryptSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Set Principal Authorization Passcode / PIN</label>
                <input
                  type="password"
                  value={encryptPasscode}
                  onChange={(e) => setEncryptPasscode(e.target.value)}
                  placeholder="Enter 4-digit PIN (e.g. 8492)"
                  required
                  minLength={4}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 font-mono tracking-widest"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEncryptModalSet(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={encrypting}
                  className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow cursor-pointer flex items-center gap-1.5"
                >
                  {encrypting ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />} Encrypt &amp; Lock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decrypt Modal */}
      {decryptModalSet && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound size={20} className="text-amber-400" />
              <h3 className="font-heading font-bold text-lg">Principal Morning Decryption</h3>
            </div>
            <p className="text-xs text-slate-300">
              Enter Principal Authorization PIN to unlock and decrypt <span className="font-bold text-amber-300">Set {decryptModalSet.set_code}</span> for exam hall printing.
            </p>

            <form onSubmit={handleDecryptSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">Principal Authorization Passcode</label>
                <input
                  type="password"
                  value={decryptPasscode}
                  onChange={(e) => setDecryptPasscode(e.target.value)}
                  placeholder="Enter PIN"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDecryptModalSet(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={decrypting}
                  className="px-5 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow cursor-pointer flex items-center gap-1.5"
                >
                  {decrypting ? <RefreshCw size={14} className="animate-spin" /> : <Unlock size={14} />} Decrypt &amp; Print
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPaperSetVault;

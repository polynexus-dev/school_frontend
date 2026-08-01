import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  CreditCard, ExternalLink, CheckCircle2, Info, ShieldCheck, Star, Loader2, RefreshCw, AlertTriangle,
} from "lucide-react";
import Modal from "../../../components/Modal";
import Button from "../../../components/Button";
import paymentGatewayService from "../../fees/services/paymentGatewayService";

const emptyForm = { mode: "test", label: "", convenience_fee_percent: "", fields: {} };

const PaymentGatewaysTab = () => {
  const [registry, setRegistry] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState({}); // { [gatewayCode]: "test" | "live" }

  const [configuring, setConfiguring] = useState(null); // registry entry currently in the modal
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [pricingChecks, setPricingChecks] = useState({}); // { [gatewayCode]: {url, checked_at, reachable, snippets, error} }
  const [checkingGateway, setCheckingGateway] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [regRes, credRes] = await Promise.all([
        paymentGatewayService.getRegistry(),
        paymentGatewayService.getCredentials(),
      ]);
      setRegistry(regRes.data || []);
      setCredentials(credRes.data?.results || credRes.data || []);
    } catch (err) {
      console.error("Failed to load payment gateways:", err);
      toast.error("Failed to load payment gateway settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const credentialsByGateway = useMemo(() => {
    const map = {};
    credentials.forEach((c) => {
      if (!map[c.gateway]) map[c.gateway] = {};
      map[c.gateway][c.mode] = c;
    });
    return map;
  }, [credentials]);

  const modeFor = (code) => {
    if (selectedMode[code]) return selectedMode[code];
    const rows = credentialsByGateway[code] || {};
    return rows.live ? "live" : "test";
  };

  const openConfigure = (entry) => {
    const mode = modeFor(entry.code);
    const existing = credentialsByGateway[entry.code]?.[mode];
    const fields = {};
    (entry.credential_fields || []).forEach((f) => {
      // Secret fields never come back from the API — leave blank so the
      // admin only overwrites them if they actually want to change the value.
      fields[f.key] = existing && !f.secret ? existing.credential_preview?.[f.key] || "" : "";
    });
    setForm({
      mode,
      label: existing?.label || "",
      convenience_fee_percent: existing?.convenience_fee_percent ?? "",
      fields,
    });
    setConfiguring(entry);
  };

  const handleModeSwitch = (mode) => {
    if (!configuring) return;
    const existing = credentialsByGateway[configuring.code]?.[mode];
    const fields = {};
    (configuring.credential_fields || []).forEach((f) => {
      fields[f.key] = existing && !f.secret ? existing.credential_preview?.[f.key] || "" : "";
    });
    setForm({
      mode,
      label: existing?.label || "",
      convenience_fee_percent: existing?.convenience_fee_percent ?? "",
      fields,
    });
  };

  const handleFieldChange = (key, value) => {
    setForm((p) => ({ ...p, fields: { ...p.fields, [key]: value } }));
  };

  const handleSave = async () => {
    if (!configuring) return;
    const missing = (configuring.credential_fields || []).filter(
      (f) => f.required !== false && !form.fields[f.key] && !credentialsByGateway[configuring.code]?.[form.mode]
    );
    if (missing.length > 0) {
      toast.error(`Missing required field(s): ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        gateway: configuring.code,
        mode: form.mode,
        label: form.label,
        convenience_fee_percent: form.convenience_fee_percent === "" ? null : Number(form.convenience_fee_percent),
        // Only send fields the admin actually typed something into — blank
        // secret fields must not overwrite an already-saved secret (the
        // serializer merges this over the existing stored credentials).
        credentials: Object.fromEntries(Object.entries(form.fields).filter(([, v]) => v !== "")),
      };
      const existing = credentialsByGateway[configuring.code]?.[form.mode];
      if (existing) {
        await paymentGatewayService.updateCredential(existing.id, payload);
      } else {
        await paymentGatewayService.createCredential(payload);
      }
      toast.success(`${configuring.label} (${form.mode === "live" ? "Live" : "Test"}) credentials saved.`);
      setConfiguring(null);
      await load();
    } catch (err) {
      console.error("Failed to save gateway credentials:", err);
      toast.error(err?.response?.data?.credentials || err?.response?.data?.detail || "Failed to save credentials.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (entry) => {
    const mode = modeFor(entry.code);
    const existing = credentialsByGateway[entry.code]?.[mode];
    if (!existing) {
      toast.error("Configure this gateway's credentials before activating it.");
      openConfigure(entry);
      return;
    }
    try {
      await paymentGatewayService.updateCredential(existing.id, { is_active: !existing.is_active });
      toast.success(`${entry.label} is now ${!existing.is_active ? "active" : "inactive"} for parent checkout.`);
      await load();
    } catch (err) {
      console.error("Failed to toggle gateway:", err);
      toast.error("Failed to update gateway status.");
    }
  };

  const handleSetDefault = async (entry) => {
    const mode = modeFor(entry.code);
    const existing = credentialsByGateway[entry.code]?.[mode];
    if (!existing) return;
    try {
      await paymentGatewayService.setDefaultCredential(existing.id);
      toast.success(`${entry.label} is now the default gateway.`);
      await load();
    } catch (err) {
      console.error("Failed to set default gateway:", err);
      toast.error(err?.response?.data?.error || "Failed to set as default.");
    }
  };

  const handleCheckLivePricing = async (entry) => {
    setCheckingGateway(entry.code);
    try {
      const res = await paymentGatewayService.checkLivePricing(entry.code);
      setPricingChecks((p) => ({ ...p, [entry.code]: res.data }));
    } catch (err) {
      console.error("Failed to check live pricing:", err);
      toast.error("Could not run the live pricing check right now.");
    } finally {
      setCheckingGateway(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-cn-surface border border-cn-border rounded-2xl">
        <Loader2 className="animate-spin mx-auto mb-2 text-violet-600" size={28} />
        <p className="text-sm font-semibold text-ink-700">Loading payment gateways...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="p-4 bg-violet-50/70 border border-violet-200 rounded-xl text-xs text-violet-900 flex items-start gap-2.5">
        <Info size={16} className="text-violet-600 shrink-0 mt-0.5" />
        <span>
          Configure the payment gateway(s) <strong>your school</strong> already has a merchant account with — fee
          payments settle directly into your own gateway account, VIDYAM never touches the money or takes a cut. You
          can activate more than one gateway at a time; parents will check out through whichever one is marked
          Default.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {registry.map((entry) => {
          const mode = modeFor(entry.code);
          const existing = credentialsByGateway[entry.code]?.[mode];
          const isConfigured = !!existing;
          const isActive = existing?.is_active || false;
          const isDefault = existing?.is_default || false;

          return (
            <div
              key={entry.code}
              className={`bg-cn-surface border rounded-2xl p-5 shadow-sm ${isActive ? "border-emerald-300" : "border-cn-border"} ${!entry.implemented ? "opacity-70" : ""}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center shrink-0">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-semibold text-sm text-ink-900">{entry.label}</h3>
                      <a href={entry.website} target="_blank" rel="noreferrer" className="text-ink-400 hover:text-violet-600">
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {!entry.implemented && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold">
                          COMING SOON
                        </span>
                      )}
                      {isConfigured && (
                        <span className="px-2 py-0.5 bg-cn-bg text-ink-600 border border-cn-border rounded text-[10px] font-semibold">
                          CONFIGURED
                        </span>
                      )}
                      {isActive && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 size={10} /> ACTIVE
                        </span>
                      )}
                      {isDefault && (
                        <span className="px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded text-[10px] font-semibold flex items-center gap-1">
                          <Star size={10} /> DEFAULT
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Test / Live mode pills */}
                <div className="flex items-center gap-1 shrink-0 bg-cn-bg rounded-lg p-0.5 border border-cn-border">
                  {["test", "live"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMode((p) => ({ ...p, [entry.code]: m }))}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase cursor-pointer transition-all ${
                        mode === m ? "bg-violet-600 text-white" : "text-ink-500 hover:text-ink-900"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11.5px] text-ink-500 leading-relaxed mb-2">{entry.pricing_note}</p>
              {entry.coming_soon_note && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mb-2">{entry.coming_soon_note}</p>
              )}

              {/* Live pricing check — a genuine on-demand fetch of the gateway's own page, never the only way to verify (see the always-present link below). */}
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => handleCheckLivePricing(entry)}
                  disabled={checkingGateway === entry.code}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 hover:underline cursor-pointer disabled:opacity-50"
                >
                  {checkingGateway === entry.code ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  {checkingGateway === entry.code ? "Checking live..." : "Check live pricing now"}
                </button>

                {pricingChecks[entry.code] && (
                  <div className="mt-2 p-2.5 bg-cn-bg border border-cn-border rounded-lg text-[11px]">
                    {pricingChecks[entry.code].error ? (
                      <p className="text-ink-500 flex items-start gap-1.5">
                        <AlertTriangle size={12} className="text-amber-600 shrink-0 mt-0.5" />
                        {pricingChecks[entry.code].error}
                      </p>
                    ) : pricingChecks[entry.code].snippets?.length > 0 ? (
                      <>
                        <p className="text-ink-600 font-semibold mb-1">Found just now on {entry.label}'s site:</p>
                        <ul className="list-disc list-inside text-ink-500 space-y-0.5">
                          {pricingChecks[entry.code].snippets.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="text-ink-500 flex items-start gap-1.5">
                        <AlertTriangle size={12} className="text-amber-600 shrink-0 mt-0.5" />
                        Couldn't auto-detect a fee % on this page (it may load pricing via JavaScript) — use the link below to check directly.
                      </p>
                    )}
                    <p className="text-ink-400 mt-1.5">
                      Checked {new Date(pricingChecks[entry.code].checked_at).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>

              <a
                href={entry.pricing_url || entry.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-600 hover:text-violet-700 hover:underline mb-3"
              >
                <ExternalLink size={11} />
                Cross-verify current pricing on {entry.label}'s official site before proceeding
              </a>

              <div className="flex items-center gap-2 pt-3 border-t border-cn-border">
                <Button variant="outline" size="compact" onClick={() => openConfigure(entry)}>
                  {isConfigured ? "Edit credentials" : "Configure"}
                </Button>
                {entry.implemented && (
                  <>
                    <Button
                      variant={isActive ? "outline" : "primary"}
                      size="compact"
                      onClick={() => handleToggleActive(entry)}
                      disabled={!isConfigured && !isActive}
                    >
                      {isActive ? "Deactivate" : "Activate"}
                    </Button>
                    {isActive && !isDefault && (
                      <Button variant="outline" size="compact" onClick={() => handleSetDefault(entry)}>
                        Make default
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={!!configuring} onClose={() => setConfiguring(null)} title={configuring ? `Configure ${configuring.label}` : ""}>
        {configuring && (
          <div className="flex flex-col gap-3.5 w-[440px] max-w-full">
            <div className="flex items-center gap-2 bg-cn-bg rounded-lg p-1 border border-cn-border w-fit">
              {["test", "live"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleModeSwitch(m)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase cursor-pointer transition-all ${
                    form.mode === m ? "bg-violet-600 text-white" : "text-ink-500 hover:text-ink-900"
                  }`}
                >
                  {m === "live" ? "Live" : "Test / Sandbox"}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1">Label (optional)</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Main HDFC account"
                className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500"
              />
            </div>

            {(configuring.credential_fields || []).map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  {field.label} {field.required !== false && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type={field.secret ? "password" : "text"}
                  value={form.fields[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={
                    field.secret && credentialsByGateway[configuring.code]?.[form.mode]
                      ? "Already saved — leave blank to keep unchanged"
                      : ""
                  }
                  className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500 font-mono"
                />
                {field.help_text && <span className="text-[10.5px] text-ink-400 mt-1 block">{field.help_text}</span>}
              </div>
            ))}

            <div className="pt-2 border-t border-cn-border">
              <label className="block text-xs font-semibold text-ink-700 mb-1">Convenience fee % passed to parent (optional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.convenience_fee_percent}
                onChange={(e) => setForm((p) => ({ ...p, convenience_fee_percent: e.target.value }))}
                placeholder="Leave blank to use the school-wide default"
                className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500"
              />
              <span className="text-[10.5px] text-ink-400 mt-1 block">
                Only applied if "Pass surcharge to parent" is selected under School Profile. Different gateways deduct
                different amounts — override here if this gateway's cut differs from the school-wide default.
              </span>
            </div>

            <div className="flex items-start gap-2 bg-cn-bg border border-cn-border rounded-xl px-3 py-2.5 text-[11px] text-ink-500">
              <ShieldCheck size={14} className="text-violet-600 shrink-0 mt-0.5" />
              <span>Secret fields are encrypted at rest and never shown again after saving — only VIDYAM's backend can use them to talk to {configuring.label}.</span>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setConfiguring(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                Save credentials
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentGatewaysTab;

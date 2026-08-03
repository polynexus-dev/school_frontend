import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ShieldCheck, CreditCard, BellRing, Activity, RefreshCw } from "lucide-react";
import Button from "../../../components/Button";
import BlackInputField from "../../../components/BlackInputField";
import reportService from "../services/reportService";

// Where a rate falls on the good/warning/critical scale — mirrors the
// success/warning/error status tokens already used elsewhere (e.g.
// ReportCards.jsx's STATUS_TONE). The payment threshold matches the
// roadmap's explicit >99.5% target; the notification threshold is this
// page's own reasonable default, not a claimed SLA, since the roadmap
// names no specific number for that one.
const toneFor = (pct, { good, warn }) => {
  if (pct === null || pct === undefined) return { badge: "bg-cn-bg text-ink-500 border-cn-border", bar: "bg-ink-300" };
  if (pct >= good) return { badge: "bg-success-tint text-success-hex border-success-hex/30", bar: "bg-success-hex" };
  if (pct >= warn) return { badge: "bg-warning-tint text-warning-hex border-warning-hex/30", bar: "bg-warning-hex" };
  return { badge: "bg-red-50 text-error-hex border-red-200", bar: "bg-error-hex" };
};

const StatTile = ({ icon, title, pct, sampleSize, sampleLabel, thresholds, note }) => {
  const tone = pct === null || pct === undefined ? toneFor(null, thresholds) : toneFor(pct, thresholds);
  return (
    <div className="p-5 rounded-xl bg-cn-surface border border-cn-border flex flex-col gap-3">
      <div className="flex items-center gap-2 text-ink-500">
        {icon}
        <span className="text-[12.5px] font-semibold uppercase tracking-wide">{title}</span>
      </div>
      {pct === null || pct === undefined ? (
        <div className="text-ink-400 text-sm py-2">{note || "No data in this window yet."}</div>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-bold text-3xl text-violet-950">{pct}%</span>
            <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 border ${tone.badge}`}>
              {pct >= thresholds.good ? "On target" : pct >= thresholds.warn ? "Watch" : "Needs attention"}
            </span>
          </div>
          <div className="w-full h-1.5 bg-cn-bg rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <p className="text-[12px] text-ink-500">{sampleSize} {sampleLabel} in this window</p>
        </>
      )}
    </div>
  );
};

const ReliabilityScorecard = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchScorecard = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await reportService.getReliabilityScorecard(params);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load reliability scorecard:", err);
      const msg = err?.response?.status === 403 ? "You don't have access to this scorecard." : "Failed to load the reliability scorecard.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-5xl">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <ShieldCheck size={22} className="text-violet-700" />
            Reliability Scorecard
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">
            Real payment and notification-delivery numbers from this school's own data — not a marketing claim.
          </p>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-5 flex-wrap bg-cn-surface border border-cn-border rounded-xl p-4">
        <BlackInputField label="Start date" fieldName="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <BlackInputField label="End date" fieldName="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <Button variant="primary" icon={<RefreshCw size={15} />} onClick={fetchScorecard} loading={loading}>
          Refresh
        </Button>
        {data && (
          <span className="text-[12px] text-ink-400 ml-auto">
            Window: {new Date(data.window.start).toLocaleDateString()} – {new Date(data.window.end).toLocaleDateString()}
            {!startDate && !endDate && " (trailing 30 days, default)"}
          </span>
        )}
      </div>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            icon={<CreditCard size={16} />}
            title="Payment success rate"
            pct={data.payment_success_rate_pct}
            sampleSize={data.payment_sample_size}
            sampleLabel="attempted transactions"
            thresholds={{ good: 99.5, warn: 95 }}
            note="No completed or failed payment attempts in this window yet."
          />
          <StatTile
            icon={<BellRing size={16} />}
            title="Notification delivery rate"
            pct={data.notification_delivery_rate_pct}
            sampleSize={data.notification_sample_size}
            sampleLabel="resolved deliveries"
            thresholds={{ good: 95, warn: 85 }}
            note="No delivered or permanently-failed notifications in this window yet."
          />
          <StatTile
            icon={<Activity size={16} />}
            title="Uptime"
            pct={null}
            thresholds={{ good: 99.9, warn: 99 }}
            note={data.uptime_note}
          />
        </div>
      )}
    </div>
  );
};

export default ReliabilityScorecard;

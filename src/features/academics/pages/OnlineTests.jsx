import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Laptop2, PlayCircle, CheckCircle2, Clock } from "lucide-react";
import Button from "../../../components/Button";
import onlineTestService from "../services/onlineTestService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const STATUS_BADGE = {
  in_progress: { label: "In progress", tone: "bg-warning-tint text-warning-hex" },
  submitted: { label: "Submitted", tone: "bg-success-tint text-success-hex" },
};

const OnlineTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await onlineTestService.getAvailableTests();
      setTests(asList(res.data));
    } catch (err) {
      console.error("Failed to load available online tests:", err);
      toast.error("Failed to load available online tests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStart = async (test) => {
    setStartingId(test.id);
    try {
      const res = await onlineTestService.startOrResumeSession(test.id);
      navigate(`/academics/online-tests/${res.data.id}`);
    } catch (err) {
      console.error("Failed to start/resume test session:", err);
      toast.error(err?.response?.data?.error || "Failed to start this test.");
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <Laptop2 size={22} className="text-violet-700" />
            Online Tests
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Timed, auto-graded tests offered for your class</p>
        </div>
      </div>

      {loading && <div className="text-ink-500 text-sm py-8 text-center">Loading…</div>}

      {!loading && tests.length === 0 && (
        <div className="text-center py-16 text-ink-400 bg-cn-surface border border-cn-border rounded-xl">
          No online tests are available for your class right now.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tests.map((test) => {
          const badge = STATUS_BADGE[test.session_status];
          return (
            <div key={test.id} className="p-4 rounded-xl bg-cn-surface border border-cn-border flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-ink-900">{test.subject_name}</span>
                  <span className="text-ink-400 text-[12.5px]">— {test.exam_term_name}</span>
                  {badge && <span className={`inline-flex items-center text-[11px] font-bold rounded-full px-2 py-0.5 ${badge.tone}`}>{badge.label}</span>}
                </div>
                <div className="flex items-center gap-3 text-[12.5px] text-ink-500 mt-1">
                  <span className="flex items-center gap-1"><Clock size={13} /> {test.time_limit_minutes} min</span>
                  <span>{test.total_marks} marks</span>
                </div>
              </div>
              {test.session_status === "submitted" ? (
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-success-hex">
                  <CheckCircle2 size={16} /> Submitted
                </span>
              ) : (
                <Button variant="primary" icon={<PlayCircle size={15} />} onClick={() => handleStart(test)} loading={startingId === test.id}>
                  {test.session_status === "in_progress" ? "Resume test" : "Start test"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnlineTests;

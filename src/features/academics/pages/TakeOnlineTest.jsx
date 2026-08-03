import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Clock, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import Button from "../../../components/Button";
import onlineTestService from "../services/onlineTestService";

const formatRemaining = (ms) => {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const TakeOnlineTest = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [exam_question_id]: { selectedOption, textAnswer } }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionRes, questionsRes, answersRes] = await Promise.all([
        onlineTestService.getSession(sessionId),
        onlineTestService.getSessionQuestions(sessionId),
        onlineTestService.getMyAnswers(sessionId),
      ]);
      setSession(sessionRes.data);
      setQuestions(questionsRes.data);
      const prefill = {};
      (Array.isArray(answersRes.data) ? answersRes.data : answersRes.data?.results || []).forEach((a) => {
        prefill[a.exam_question] = { selectedOption: a.selected_option, textAnswer: a.text_answer || "" };
      });
      setAnswers(prefill);
    } catch (err) {
      console.error("Failed to load test session:", err);
      toast.error("Failed to load this test.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const deadlineMs = session?.deadline ? new Date(session.deadline).getTime() : null;
  const remainingMs = deadlineMs ? deadlineMs - now : null;
  const isSubmitted = session?.status === "submitted";
  const isExpired = remainingMs !== null && remainingMs <= 0 && !isSubmitted;
  const canEdit = !isSubmitted && !isExpired;

  const handleSelectOption = async (question, optionId) => {
    setAnswers((prev) => ({ ...prev, [question.id]: { ...prev[question.id], selectedOption: optionId, textAnswer: "" } }));
    try {
      await onlineTestService.saveAnswer({ session: sessionId, examQuestion: question.id, selectedOption: optionId });
    } catch (err) {
      console.error("Failed to save answer:", err);
      toast.error("Failed to save your answer — try selecting it again.");
    }
  };

  const handleTextBlur = async (question) => {
    const textAnswer = answers[question.id]?.textAnswer || "";
    try {
      await onlineTestService.saveAnswer({ session: sessionId, examQuestion: question.id, textAnswer });
    } catch (err) {
      console.error("Failed to save answer:", err);
      toast.error("Failed to save your answer.");
    }
  };

  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]?.selectedOption || answers[q.id]?.textAnswer).length,
    [questions, answers]
  );

  const handleSubmit = async () => {
    if (!window.confirm(`Submit this test? You've answered ${answeredCount} of ${questions.length} questions. This can't be undone.`)) return;
    setSubmitting(true);
    try {
      await onlineTestService.submitSession(sessionId);
      toast.success("Test submitted.");
      await load();
    } catch (err) {
      console.error("Failed to submit test:", err);
      toast.error(err?.response?.data?.error || "Failed to submit this test.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-ink-500 text-sm py-8 text-center">Loading…</div>;
  if (!session) return <div className="text-ink-500 text-sm py-8 text-center">Test session not found.</div>;

  return (
    <div className="w-full max-w-3xl pb-20">
      <div className="sticky top-0 z-10 bg-cn-bg pt-1 pb-4 border-b border-cn-border mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-xl text-violet-950">{session.exam_paper_label}</h1>
          <p className="text-ink-500 text-[12.5px] mt-0.5">{answeredCount} of {questions.length} answered</p>
        </div>
        {!isSubmitted && (
          <div className={`flex items-center gap-1.5 font-heading font-bold text-lg px-3 py-1.5 rounded-lg ${isExpired ? "bg-red-50 text-error-hex" : "bg-violet-50 text-violet-700"}`}>
            <Clock size={18} />
            {isExpired ? "Time's up" : formatRemaining(remainingMs)}
          </div>
        )}
      </div>

      {isSubmitted && (
        <div className="flex items-center gap-2 bg-success-tint text-success-hex border border-success-hex/30 rounded-lg p-3 mb-5 text-[13px] font-semibold">
          <CheckCircle2 size={16} /> This test has been submitted. Your teacher will publish marks once grading is complete.
        </div>
      )}
      {isExpired && (
        <div className="flex items-center gap-2 bg-red-50 text-error-hex border border-red-200 rounded-lg p-3 mb-5 text-[13px] font-semibold">
          <AlertTriangle size={16} /> Time's up — you can no longer change answers. Submit now to hand in what you've answered.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="p-4 rounded-xl bg-cn-surface border border-cn-border">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="font-semibold text-ink-900 text-[14px]">
                {idx + 1}. {q.question_text_snapshot}
              </p>
              <span className="text-[11.5px] font-bold text-ink-500 shrink-0">{q.marks} marks</span>
            </div>

            {q.question_type === "mcq" ? (
              <div className="flex flex-col gap-2 mt-2">
                {q.options.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2 text-[13.5px] px-3 py-2 rounded-lg border cursor-pointer transition ${
                      answers[q.id]?.selectedOption === opt.id ? "border-violet-500 bg-violet-50" : "border-cn-border hover:border-violet-300"
                    } ${!canEdit ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      checked={answers[q.id]?.selectedOption === opt.id}
                      disabled={!canEdit}
                      onChange={() => handleSelectOption(q, opt.id)}
                    />
                    {opt.text}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                rows={3}
                disabled={!canEdit}
                value={answers[q.id]?.textAnswer || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: { ...prev[q.id], textAnswer: e.target.value } }))}
                onBlur={() => handleTextBlur(q)}
                placeholder="Type your answer…"
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-transparent text-[13.5px] text-dark outline-none focus:border-violet-500 disabled:opacity-70"
              />
            )}
          </div>
        ))}
      </div>

      {!isSubmitted && (
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 md:-mx-8 mt-6 bg-cn-surface border-t border-cn-border p-4 flex justify-end">
          <Button variant="primary" icon={<Send size={15} />} onClick={handleSubmit} loading={submitting}>
            Submit test
          </Button>
        </div>
      )}
      {isSubmitted && (
        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate("/academics/online-tests")}>
            Back to online tests
          </Button>
        </div>
      )}
    </div>
  );
};

export default TakeOnlineTest;

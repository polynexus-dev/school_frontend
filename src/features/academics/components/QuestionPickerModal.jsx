import React, { useEffect, useState } from "react";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import Button from "../../../components/Button";
import questionBankService from "../services/questionBankService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

// Shared "pick an active bank question" picker, used by ExamPaperBuilder for
// both "Add Question" (topic chosen here) and "Replace" (topic locked to the
// row being replaced, via lockedTopicId).
const QuestionPickerModal = ({
  isOpen,
  onClose,
  classSection,
  subject,
  topics = [],
  lockedTopicId = null,
  title = "Pick a question",
  onPick,
}) => {
  const [topicId, setTopicId] = useState(lockedTopicId ? String(lockedTopicId) : "");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setTopicId(lockedTopicId ? String(lockedTopicId) : "");
      setSelectedId(null);
    }
  }, [isOpen, lockedTopicId]);

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !classSection || !subject || !topicId) {
        setQuestions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await questionBankService.getQuestions({ class_section: classSection, subject, topic: topicId });
        setQuestions(asList(res.data));
      } catch (err) {
        console.error("Failed to load bank questions:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, classSection, subject, topicId]);

  const topicOptions = topics.map((t) => ({ label: t.name, value: String(t.id) }));

  const handleConfirm = () => {
    const question = questions.find((q) => q.id === selectedId);
    if (!question) return;
    onPick(question);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-3 w-[440px] max-w-full">
        {!lockedTopicId && (
          <SelectBox
            label="Topic"
            fieldName="picker_topic"
            value={topicId}
            onChange={(e) => {
              setTopicId(e.target.value);
              setSelectedId(null);
            }}
            options={topicOptions}
          />
        )}

        <div className="max-h-[320px] overflow-y-auto flex flex-col gap-2 border border-cn-border rounded-xl p-2">
          {loading && <div className="text-center text-ink-400 text-sm py-6">Loading…</div>}
          {!loading && topicId && questions.length === 0 && (
            <div className="text-center text-ink-400 text-sm py-6">No active bank questions for this topic.</div>
          )}
          {!loading && !topicId && <div className="text-center text-ink-400 text-sm py-6">Pick a topic to see questions.</div>}
          {questions.map((q) => (
            <label
              key={q.id}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                selectedId === q.id ? "border-violet-500 bg-violet-50" : "border-cn-border hover:bg-violet-50/50"
              }`}
            >
              <input type="radio" name="bank_question" checked={selectedId === q.id} onChange={() => setSelectedId(q.id)} className="mt-1" />
              <div className="min-w-0">
                <div className="text-[13px] text-ink-900">{q.text}</div>
                <div className="text-[11px] text-ink-500 mt-0.5 uppercase font-semibold">
                  {q.marks} marks · {q.difficulty}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!selectedId}>
            Use this question
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuestionPickerModal;

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, TrendingDown } from "lucide-react";
import Button from "../../../components/Button";
import SelectBox from "../../../components/SelectBox";
import studentService from "../services/studentService";
import subjectService from "../../academics/services/subjectService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const tintFor = (percentage) => {
  if (percentage >= 70) return { bar: "bg-success-hex", tint: "bg-success-tint text-success-hex" };
  if (percentage >= 40) return { bar: "bg-warning-hex", tint: "bg-warning-tint text-warning-hex" };
  return { bar: "bg-error-hex", tint: "bg-error-tint text-error-hex" };
};

const StudentProgress = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTopics = useCallback(
    async (subject) => {
      try {
        const res = await studentService.getTopicMastery(id, subject || undefined);
        setTopics(res.data.topics || []);
      } catch (err) {
        console.error("Failed to load topic mastery:", err);
        toast.error("Failed to load this student's progress.");
      }
    },
    [id]
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [studentRes, subjectsRes] = await Promise.all([studentService.getStudent(id), subjectService.getSubjects()]);
        setStudent(studentRes.data);
        setSubjects(asList(subjectsRes.data));
        await loadTopics("");
      } catch (err) {
        console.error("Failed to load student progress page:", err);
        toast.error("Failed to load this student.");
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubjectChange = (value) => {
    setSubjectId(value);
    loadTopics(value);
  };

  const weakestTopic = topics.reduce((weakest, t) => (!weakest || t.percentage < weakest.percentage ? t : weakest), null);

  if (loading || !student) {
    return <div className="w-full text-center text-ink-400 text-sm py-16">Loading…</div>;
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => navigate("/students")}>
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">{student.full_name || student.name}</h1>
          <p className="text-ink-500 text-[13px] mt-1">Topic-wise progress · which topics need the most focus</p>
        </div>
        <SelectBox
          className="w-56"
          label="Subject"
          fieldName="subject"
          value={subjectId}
          onChange={(e) => handleSubjectChange(e.target.value)}
          options={[{ label: "All subjects", value: "" }, ...subjects.map((s) => ({ label: s.name, value: String(s.id) }))]}
        />
      </div>

      {weakestTopic && (
        <div className="bg-error-tint border border-red-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <TrendingDown size={18} className="text-error-hex shrink-0" />
          <p className="text-[13px] text-ink-700">
            Needs the most focus: <span className="font-bold text-error-hex">{weakestTopic.topic_name}</span> ({weakestTopic.percentage}%)
          </p>
        </div>
      )}

      <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
        {topics.length === 0 ? (
          <p className="text-ink-500 text-[13px] text-center py-10">
            No graded exam questions yet for this student{subjectId ? " in this subject" : ""}. Progress appears once a teacher grades a
            finalized exam paper question-by-question and publishes it.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {topics.map((t) => {
              const { bar, tint } = tintFor(t.percentage);
              return (
                <div key={t.topic_id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13.5px] font-semibold text-ink-900">{t.topic_name}</span>
                    <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${tint}`}>
                      {t.marks_obtained} / {t.marks_total} · {t.percentage}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-cn-bg overflow-hidden">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(t.percentage, 100)}%` }} />
                  </div>
                  <span className="text-[11px] text-ink-400 mt-1 block">
                    {t.questions_attempted} question{t.questions_attempted === 1 ? "" : "s"} graded
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgress;

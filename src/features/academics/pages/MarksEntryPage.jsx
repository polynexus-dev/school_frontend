import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ClipboardEdit, Save, Send } from "lucide-react";
import Button from "../../../components/Button";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import marksEntryService from "../services/marksEntryService";
import examTermService from "../services/examTermService";
import classSectionService from "../../students/services/classSectionService";
import subjectService from "../services/subjectService";
import studentService from "../../students/services/studentService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || cs?.name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;
const studentLabel = (s) => `${s.user?.first_name || ""} ${s.user?.last_name || ""}`.trim() || s.user?.username || `#${s.id}`;

const MarksEntryPage = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isHmOrAdmin = !["Teacher", "Parent", "Conductor", "Student"].includes(roleName) || user?.data?.is_hm;

  const [examTerms, setExamTerms] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [examTerm, setExamTerm] = useState("");
  const [classSection, setClassSection] = useState("");
  const [subject, setSubject] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");

  const [students, setStudents] = useState([]);
  const [entriesByStudent, setEntriesByStudent] = useState({}); // { [studentId]: MarksEntry | undefined }
  const [marksInput, setMarksInput] = useState({}); // { [studentId]: string }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [etRes, csRes, subRes] = await Promise.all([
          examTermService.getExamTerms(), classSectionService.getClassSections(), subjectService.getSubjects(),
        ]);
        setExamTerms(asList(etRes.data));
        setClassSections(asList(csRes.data));
        setSubjects(asList(subRes.data));
      } catch (err) {
        console.error("Failed to load marks-entry filter data:", err);
        toast.error("Failed to load exam terms / classes / subjects.");
      }
    };
    load();
  }, []);

  const ready = examTerm && classSection && subject;

  const loadRosterAndEntries = async () => {
    if (!ready) return;
    setLoading(true);
    try {
      const [rosterRes, entriesRes] = await Promise.all([
        studentService.getRoster(classSection),
        marksEntryService.getMarksEntries({ examTerm, classSection, subject }),
      ]);
      const roster = asList(rosterRes.data).filter((s) => s.status === "active");
      setStudents(roster);

      const byStudent = {};
      const inputs = {};
      let commonMaxMarks = null;
      entriesRes.data.forEach((entry) => {
        byStudent[entry.student] = entry;
        inputs[entry.student] = String(entry.marks_obtained);
        commonMaxMarks = entry.max_marks;
      });
      setEntriesByStudent(byStudent);
      setMarksInput(inputs);
      if (commonMaxMarks) setMaxMarks(String(commonMaxMarks));
    } catch (err) {
      console.error("Failed to load roster/marks entries:", err);
      toast.error("Failed to load class roster or existing marks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRosterAndEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examTerm, classSection, subject]);

  const examTermOptions = useMemo(() => examTerms.map((t) => ({ label: t.name, value: String(t.id) })), [examTerms]);
  const classSectionOptions = useMemo(() => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })), [classSections]);
  const subjectOptions = useMemo(() => subjects.map((s) => ({ label: s.name, value: String(s.id) })), [subjects]);

  const handleMarksChange = (studentId, value) => {
    setMarksInput((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSave = async () => {
    const entries = students
      .filter((s) => marksInput[s.id] !== undefined && marksInput[s.id] !== "")
      .map((s) => ({
        exam_term: Number(examTerm), student: s.id, subject: Number(subject), class_section: Number(classSection),
        marks_obtained: marksInput[s.id], max_marks: maxMarks,
      }));
    if (entries.length === 0) {
      toast.error("Enter at least one student's marks first.");
      return;
    }
    setSaving(true);
    try {
      const res = await marksEntryService.saveMarksEntries(entries);
      const savedCount = res.data.results?.length ?? 0;
      const lockedCount = res.data.locked_student_ids?.length ?? 0;
      if (lockedCount > 0) {
        toast.warn(`Saved ${savedCount}. ${lockedCount} already-published entr${lockedCount === 1 ? "y is" : "ies are"} locked — flagged for Head Master/Mistress approval instead.`);
      } else {
        toast.success(`Saved ${savedCount} entr${savedCount === 1 ? "y" : "ies"}.`);
      }
      loadRosterAndEntries();
    } catch (err) {
      console.error("Failed to save marks entries:", err);
      toast.error(err?.response?.data?.error || "Failed to save marks.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await marksEntryService.publishMarksEntries(Number(examTerm), Number(classSection), Number(subject));
      toast.success(`Published ${res.data.published_count} entr${res.data.published_count === 1 ? "y" : "ies"} — guardians notified.`);
      loadRosterAndEntries();
    } catch (err) {
      console.error("Failed to publish marks:", err);
      toast.error(err?.response?.data?.error || "Failed to publish marks.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <ClipboardEdit size={22} className="text-violet-700" />
            Marks Entry
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Direct subject-wise marks entry for a class — publish once finalized to notify guardians.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-5 bg-cn-surface border border-cn-border rounded-xl p-4">
        <SelectBox className="w-52" label="Exam Term" fieldName="exam_term" value={examTerm} onChange={(e) => setExamTerm(e.target.value)} options={examTermOptions} />
        <SelectBox className="w-56" label="Class & Section" fieldName="class_section" value={classSection} onChange={(e) => setClassSection(e.target.value)} options={classSectionOptions} />
        <SelectBox className="w-48" label="Subject" fieldName="subject" value={subject} onChange={(e) => setSubject(e.target.value)} options={subjectOptions} />
        <BlackInputField className="w-32" label="Max Marks" fieldName="max_marks" type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
      </div>

      {!ready && <div className="text-center py-12 text-ink-400 bg-cn-surface border border-cn-border rounded-xl">Pick an exam term, class/section, and subject to load the roster.</div>}

      {ready && loading && <div className="text-ink-500 text-sm py-8 text-center">Loading roster…</div>}

      {ready && !loading && (
        <>
          <div className="bg-cn-surface border border-cn-border rounded-xl overflow-hidden">
            <table className="min-w-full font-sans text-left border-collapse">
              <thead>
                <tr className="border-b border-cn-border bg-violet-50/50">
                  <th className="p-3 text-[11.5px] font-semibold tracking-wider text-ink-500 uppercase">Student</th>
                  <th className="p-3 text-[11.5px] font-semibold tracking-wider text-ink-500 uppercase">Admission No.</th>
                  <th className="p-3 text-[11.5px] font-semibold tracking-wider text-ink-500 uppercase">Marks Obtained</th>
                  <th className="p-3 text-[11.5px] font-semibold tracking-wider text-ink-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="text-[13.5px] text-ink-700 divide-y divide-violet-50">
                {students.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-ink-400">No active students in this class.</td></tr>
                )}
                {students.map((s) => {
                  const entry = entriesByStudent[s.id];
                  const isLocked = entry && !entry.is_draft && !isHmOrAdmin;
                  return (
                    <tr key={s.id} className="hover:bg-violet-50 transition duration-150">
                      <td className="p-3">{studentLabel(s)}</td>
                      <td className="p-3">{s.admission_no}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={marksInput[s.id] ?? ""}
                          onChange={(e) => handleMarksChange(s.id, e.target.value)}
                          min={0}
                          max={Number(maxMarks) || undefined}
                          className="w-24 px-2 py-1 border border-slate-300 rounded-md bg-transparent text-[13.5px] outline-none focus:border-violet-500"
                        />
                      </td>
                      <td className="p-3">
                        {!entry ? (
                          <span className="text-ink-400 text-[11.5px]">Not entered</span>
                        ) : entry.is_draft ? (
                          <span className="inline-flex items-center text-[11px] font-bold rounded-full px-2 py-0.5 bg-warning-tint text-warning-hex">DRAFT</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-0.5 bg-success-tint text-success-hex">
                            PUBLISHED{isLocked ? " · LOCKED" : ""}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" icon={<Save size={15} />} onClick={handleSave} loading={saving}>
              Save marks
            </Button>
            <Button variant="primary" icon={<Send size={15} />} onClick={handlePublish} loading={publishing}>
              Publish
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MarksEntryPage;

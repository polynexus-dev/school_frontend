import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Download, IdCard } from "lucide-react";
import Button from "../../../components/Button";
import SelectBox from "../../../components/SelectBox";
import examSchedulingService from "../services/examSchedulingService";
import examTermService from "../services/examTermService";
import classSectionService from "../../students/services/classSectionService";
import studentService from "../../students/services/studentService";
import messagingService from "../../messaging/services/messagingService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || cs?.name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

const HallTicket = () => {
  const { user } = useUser();
  const profile = user?.data;
  const roleName = profile?.role || "Admin";
  const isParent = roleName === "Parent";
  const isStudent = roleName === "Student";
  const isSelfView = isParent || isStudent;

  const [examTerms, setExamTerms] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [myChildren, setMyChildren] = useState([]);

  const [examTerm, setExamTerm] = useState("");
  const [classSection, setClassSection] = useState("");
  const [student, setStudent] = useState("");
  const [selectedChild, setSelectedChild] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const etRes = await examTermService.getExamTerms();
        setExamTerms(asList(etRes.data));
        if (isParent) {
          const childRes = await messagingService.getMyChildren();
          const children = asList(childRes.data);
          setMyChildren(children);
          if (children.length === 1) setSelectedChild(String(children[0].student));
        } else if (!isSelfView) {
          const csRes = await classSectionService.getClassSections();
          setClassSections(asList(csRes.data));
        }
      } catch (err) {
        console.error("Failed to load hall ticket filters:", err);
        toast.error("Failed to load exam terms.");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isSelfView || !classSection) {
      setStudents([]);
      return;
    }
    const loadRoster = async () => {
      try {
        const res = await studentService.getRoster(classSection);
        setStudents(asList(res.data));
      } catch (err) {
        console.error("Failed to load class roster:", err);
        toast.error("Failed to load students for this class.");
      }
    };
    loadRoster();
  }, [classSection, isSelfView]);

  const examTermOptions = useMemo(() => examTerms.map((t) => ({ label: t.name, value: String(t.id) })), [examTerms]);
  const classSectionOptions = useMemo(() => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })), [classSections]);
  const studentOptions = useMemo(
    () => students.map((s) => ({ label: `${s.user?.first_name || s.user?.username || "—"} (${s.admission_no})`, value: String(s.id) })),
    [students]
  );
  const childOptions = useMemo(
    () => myChildren.map((link) => ({ label: link.student_name || link.student_detail?.full_name || `Student #${link.student}`, value: String(link.student) })),
    [myChildren]
  );

  const targetStudentId = isStudent ? profile?.id : isParent ? selectedChild : student;

  const handleDownload = async () => {
    if (!examTerm) {
      toast.error("Pick an exam term.");
      return;
    }
    if (!targetStudentId) {
      toast.error(isParent ? "No linked child found." : "Pick a student.");
      return;
    }
    setDownloading(true);
    try {
      const res = await examSchedulingService.downloadHallTicket(targetStudentId, examTerm);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `hall-ticket-${targetStudentId}-${examTerm}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download hall ticket:", err);
      toast.error(err?.response?.data?.error || "Failed to download hall ticket — the datesheet may not be published yet.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Hall Ticket</h1>
          <p className="text-ink-500 text-[13px] mt-1">
            {isSelfView ? "Download your exam hall ticket / admit card" : "Download a student's exam hall ticket / admit card"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <SelectBox className="w-56" label="Exam Term" fieldName="exam_term" value={examTerm} onChange={(e) => setExamTerm(e.target.value)} options={examTermOptions} />
        {isParent && childOptions.length > 1 && (
          <SelectBox className="w-56" label="Child" fieldName="child" value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)} options={childOptions} />
        )}
        {!isSelfView && (
          <>
            <SelectBox className="w-56" label="Class & Section" fieldName="class_section" value={classSection} onChange={(e) => setClassSection(e.target.value)} options={classSectionOptions} />
            <SelectBox className="w-64" label="Student" fieldName="student" value={student} onChange={(e) => setStudent(e.target.value)} options={studentOptions} />
          </>
        )}
        <Button variant="primary" icon={<Download size={16} />} onClick={handleDownload} loading={downloading}>
          Download Hall Ticket
        </Button>
      </div>

      <div className="flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-lg p-4 text-[13px] text-ink-700 max-w-xl">
        <IdCard size={18} className="text-violet-700 shrink-0 mt-0.5" />
        <p>The hall ticket includes the full datesheet for the student's class in the selected exam term, and a seat number wherever a seating arrangement has been published for that date.</p>
      </div>
    </div>
  );
};

export default HallTicket;

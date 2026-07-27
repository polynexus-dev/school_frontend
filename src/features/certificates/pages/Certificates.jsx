import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Download, Award } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import certificateService from "../services/certificateService";
import classSectionService from "../../students/services/classSectionService";
import studentService from "../../students/services/studentService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;
const emptyForm = { class_section: "", student: "", template: "", date_of_leaving: "", reason_for_leaving: "" };

const Certificates = () => {
  const [issued, setIssued] = useState([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [sectionStudents, setSectionStudents] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await certificateService.getIssuedCertificates();
      setIssued(asList(res.data));
    } catch (err) {
      console.error("Failed to load issued certificates:", err);
      toast.error("Failed to load issued certificates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    certificateService.getTemplates().then((res) => setTemplates(asList(res.data))).catch(() => {});
    classSectionService.getClassSections().then((res) => setClassSections(asList(res.data))).catch(() => {});
  }, []);

  const handleClassChange = async (classSectionId) => {
    setForm((p) => ({ ...p, class_section: classSectionId, student: "" }));
    if (!classSectionId) {
      setSectionStudents([]);
      return;
    }
    try {
      const res = await studentService.getRoster(classSectionId);
      setSectionStudents(asList(res.data));
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  const selectedTemplateName = useMemo(() => templates.find((t) => String(t.id) === form.template)?.name || "", [templates, form.template]);

  const handleIssue = async () => {
    if (!form.student || !form.template) {
      toast.error("Student and certificate type are both required.");
      return;
    }
    setSaving(true);
    try {
      const extra_context = {};
      if (form.date_of_leaving) extra_context.date_of_leaving = form.date_of_leaving;
      if (form.reason_for_leaving) extra_context.reason_for_leaving = form.reason_for_leaving;
      await certificateService.issueCertificate({ student: Number(form.student), template: Number(form.template), extra_context });
      toast.success("Certificate issued.");
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      console.error("Failed to issue certificate:", err);
      toast.error("Failed to issue certificate.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (cert) => {
    setDownloadingId(cert.id);
    try {
      await certificateService.downloadCertificate(cert.id, `${cert.certificate_number}.pdf`);
    } catch (err) {
      console.error("Failed to download certificate:", err);
      toast.error("Failed to download certificate.");
    } finally {
      setDownloadingId(null);
    }
  };

  const classSectionOptions = useMemo(() => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })), [classSections]);
  const studentOptions = useMemo(
    () => sectionStudents.map((s) => ({ label: `${s.full_name || s.name} (${s.admission_number || s.admission_no})`, value: String(s.id) })),
    [sectionStudents]
  );
  const templateOptions = useMemo(() => templates.map((t) => ({ label: t.name, value: String(t.id) })), [templates]);

  const columns = [
    { header: "Certificate No.", accessor: "certificate_number" },
    { header: "Type", accessor: "template_name" },
    { header: "Student", accessor: "student_name" },
    { header: "Issued by", accessor: "issued_by_name" },
    { header: "Issued on", accessor: (row) => new Date(row.issued_at).toLocaleDateString() },
    {
      header: "Actions",
      accessor: (row) => (
        <button type="button" onClick={() => handleDownload(row)} disabled={downloadingId === row.id} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer">
          <Download size={13} className="inline mr-1" />
          {downloadingId === row.id ? "Downloading…" : "Download PDF"}
        </button>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <Award size={22} className="text-violet-700" />
            Certificates
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Bonafide, Transfer and Character certificates</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Issue certificate
        </Button>
      </div>

      <Table columns={columns} data={issued} loading={loading} emptyMessage="No certificates issued yet" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Issue certificate">
        <div className="flex flex-col gap-3 w-[340px] max-w-full">
          <SelectBox label="Class" fieldName="class_section" value={form.class_section} onChange={(e) => handleClassChange(e.target.value)} options={classSectionOptions} />
          <SelectBox
            label="Student"
            fieldName="student"
            value={form.student}
            onChange={(e) => setForm((p) => ({ ...p, student: e.target.value }))}
            options={studentOptions.length ? studentOptions : [{ label: "Pick a class first", value: "" }]}
          />
          <SelectBox label="Certificate type" fieldName="template" value={form.template} onChange={(e) => setForm((p) => ({ ...p, template: e.target.value }))} options={templateOptions} />
          {selectedTemplateName === "Transfer Certificate" && (
            <>
              <BlackInputField label="Date of leaving" fieldName="date_of_leaving" type="date" value={form.date_of_leaving} onChange={(e) => setForm((p) => ({ ...p, date_of_leaving: e.target.value }))} />
              <BlackInputField label="Reason for leaving" fieldName="reason_for_leaving" value={form.reason_for_leaving} onChange={(e) => setForm((p) => ({ ...p, reason_for_leaving: e.target.value }))} />
            </>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleIssue} loading={saving}>
              Issue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Certificates;

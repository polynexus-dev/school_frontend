import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { HeartPulse, Plus, ShieldAlert, UserCheck, Stethoscope } from "lucide-react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import medicalService from "../services/medicalService";
import api from "../../../services/api";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const Infirmary = () => {
  const [activeTab, setActiveTab] = useState("visits"); // "visits" | "alerts"
  const [visits, setVisits] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Visit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student: "",
    reason_for_visit: "",
    symptoms: "",
    treatment_given: "",
    action_taken: "rested",
    parent_notified: false,
    nurse_notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, aRes, stRes] = await Promise.all([
        medicalService.getInfirmaryVisits(),
        medicalService.getMedicalAlerts(),
        api.get("students/"),
      ]);
      setVisits(asList(vRes.data));
      setAlerts(aRes.data?.alerts || []);
      setHighRiskCount(aRes.data?.high_risk_count || 0);
      setStudents(asList(stRes.data));
    } catch (err) {
      console.error("Failed to load infirmary data:", err);
      toast.error("Failed to load infirmary records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveVisit = async () => {
    if (!form.student || !form.reason_for_visit) {
      toast.error("Student and Reason for visit are required.");
      return;
    }
    setSaving(true);
    try {
      await medicalService.createInfirmaryVisit({
        ...form,
        student: Number(form.student),
      });
      toast.success("Infirmary visit logged successfully!");
      setIsModalOpen(false);
      setForm({
        student: "",
        reason_for_visit: "",
        symptoms: "",
        treatment_given: "",
        action_taken: "rested",
        parent_notified: false,
        nurse_notes: "",
      });
      loadData();
    } catch (err) {
      console.error("Failed to log visit:", err);
      toast.error("Failed to log infirmary visit.");
    } finally {
      setSaving(false);
    }
  };

  const studentOptions = students.map((s) => ({
    label: `${s.user_detail?.first_name || ""} ${s.user_detail?.last_name || ""} (${s.admission_no})`.trim(),
    value: String(s.id),
  }));

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cn-border mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="text-red-500" size={26} />
            <h1 className="font-heading font-bold text-2xl text-violet-950">School Infirmary & Medical System</h1>
          </div>
          <p className="text-ink-500 text-[13px] mt-1">
            Nurse visit logs, daily medication tracking, and high-risk medical allergy alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <Plus size={16} /> Log Nurse Visit
          </Button>
        </div>
      </div>

      {/* High Risk Alert Banner */}
      {highRiskCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-900">
                {highRiskCount} High-Risk Medical {highRiskCount === 1 ? "Alert" : "Alerts"} Active
              </h3>
              <p className="text-xs text-red-700 mt-0.5">
                Students with severe allergies (peanut, penicillin) or chronic asthma flagged for Teachers & Canteen.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("alerts")}
            className="text-xs font-bold bg-red-600 text-white px-3.5 py-2 rounded-lg hover:bg-red-700 transition"
          >
            View High-Risk List
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-cn-border mb-6">
        <button
          onClick={() => setActiveTab("visits")}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === "visits" ? "border-violet-600 text-violet-950" : "border-transparent text-ink-400 hover:text-ink-700"
          }`}
        >
          🩺 Nurse Visit Log ({visits.length})
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === "alerts" ? "border-violet-600 text-violet-950" : "border-transparent text-ink-400 hover:text-ink-700"
          }`}
        >
          ⚠️ Medical & Allergy Alerts ({alerts.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-ink-400 text-sm py-16">Loading infirmary records…</p>
      ) : activeTab === "visits" ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-cn-border text-left text-xs font-bold text-ink-400">
                <th className="p-3">STUDENT</th>
                <th className="p-3">CLASS</th>
                <th className="p-3">REASON / SYMPTOMS</th>
                <th className="p-3">TREATMENT GIVEN</th>
                <th className="p-3">ACTION TAKEN</th>
                <th className="p-3">DATE & TIME</th>
              </tr>
            </thead>
            <tbody>
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-ink-400 text-sm">
                    No infirmary visits logged yet.
                  </td>
                </tr>
              ) : (
                visits.map((v) => (
                  <tr key={v.id} className="border-b border-cn-border/60 hover:bg-cn-surface text-xs text-ink-800">
                    <td className="p-3 font-semibold text-ink-900">{v.student_name}</td>
                    <td className="p-3 font-medium text-violet-700">{v.class_section_name || "—"}</td>
                    <td className="p-3 font-medium">{v.reason_for_visit}</td>
                    <td className="p-3">{v.treatment_given || "—"}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-violet-100 text-violet-800">
                        {v.action_taken_display || v.action_taken}
                      </span>
                    </td>
                    <td className="p-3 text-ink-400">{new Date(v.visited_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.length === 0 ? (
            <p className="text-center col-span-2 py-12 text-ink-400 text-sm">No high-risk medical alerts found.</p>
          ) : (
            alerts.map((al) => (
              <div key={al.id} className="p-4 rounded-2xl border border-red-200 bg-red-50/50 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-red-950">{al.student_name}</h4>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-red-600 text-white">HIGH RISK</span>
                </div>
                <div className="text-xs text-ink-700">
                  <span className="font-bold text-ink-900">Class:</span> {al.class_section_name} |{" "}
                  <span className="font-bold text-ink-900">Blood Group:</span> {al.blood_group || "Unknown"}
                </div>
                {al.allergies && (
                  <div className="text-xs bg-white p-2.5 rounded-xl border border-red-100 text-red-900">
                    <span className="font-bold">Severe Allergies:</span> {al.allergies}
                  </div>
                )}
                {al.chronic_conditions && (
                  <div className="text-xs bg-white p-2.5 rounded-xl border border-red-100 text-red-900">
                    <span className="font-bold">Chronic Conditions:</span> {al.chronic_conditions}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Log Visit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="🩺 Log Infirmary / Nurse Visit">
        <div className="flex flex-col gap-3 w-[420px] max-w-full">
          <SelectBox
            label="Student"
            fieldName="student"
            value={form.student}
            onChange={(e) => setForm((p) => ({ ...p, student: e.target.value }))}
            options={[{ label: "— Select Student —", value: "" }, ...studentOptions]}
          />

          <div>
            <label className="block text-xs font-medium mb-1 text-ink-700">Reason for Visit</label>
            <input
              value={form.reason_for_visit}
              onChange={(e) => setForm((p) => ({ ...p, reason_for_visit: e.target.value }))}
              placeholder="e.g. High fever, headache, sports injury"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-ink-700">Symptoms</label>
            <textarea
              rows={2}
              value={form.symptoms}
              onChange={(e) => setForm((p) => ({ ...p, symptoms: e.target.value }))}
              placeholder="Body temp 101F, dizziness"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-ink-700">Treatment Given</label>
            <input
              value={form.treatment_given}
              onChange={(e) => setForm((p) => ({ ...p, treatment_given: e.target.value }))}
              placeholder="Paracetamol 250mg, cold compress, 30 min rest"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-violet-500"
            />
          </div>

          <SelectBox
            label="Action Taken"
            fieldName="action_taken"
            value={form.action_taken}
            onChange={(e) => setForm((p) => ({ ...p, action_taken: e.target.value }))}
            options={[
              { label: "Rested in Infirmary", value: "rested" },
              { label: "Returned to Class", value: "returned_to_class" },
              { label: "Sent Home", value: "sent_home" },
              { label: "Hospitalized", value: "hospitalized" },
            ]}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="parent_notified"
              checked={form.parent_notified}
              onChange={(e) => setForm((p) => ({ ...p, parent_notified: e.target.checked }))}
              className="w-4 h-4 text-violet-600 rounded"
            />
            <label htmlFor="parent_notified" className="text-xs font-medium text-ink-700 cursor-pointer">
              Notify Parent via App Notification
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveVisit} loading={saving} className="bg-red-600 hover:bg-red-700 text-white">
              Save Visit Log
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Infirmary;

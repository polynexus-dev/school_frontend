import React, { useState, useEffect } from "react";
import useUser from "../../auth/hooks/useUser";
import {
  getStaffPermissions,
  updateStaffPermission,
} from "../services/permissionService";
import {
  changePassword,
  getSchoolProfile,
  updateSchoolProfile,
  getAcademicYears,
  createAcademicYear,
  getClassSections,
  createClassSection,
  getSubjects,
  createSubject,
} from "../services/settingsService";
import {
  User,
  ShieldCheck,
  Search,
  Check,
  X,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Lock,
  Building,
  Sliders,
  BadgeCheck,
  UserCheck,
  AlertCircle,
  KeyRound,
  Building2,
  GraduationCap,
  Plus,
  BookOpen,
  Calendar,
  MessageSquare,
} from "lucide-react";

const Settings = () => {
  const { user } = useUser();
  const profile = user?.data;

  const roleName = profile?.role || "Admin";
  const isAdmin = ["School Admin", "Management", "SaaS Admin", "Admin"].includes(roleName);

  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "security" | "school" | "academic" | "permissions"

  // Global Messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Staff Permissions Manager State
  const [availableModules, setAvailableModules] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [savingStaffId, setSavingStaffId] = useState(null);
  const [editedPermissions, setEditedPermissions] = useState({});

  // Password Change State
  const [pwData, setPwData] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [pwLoading, setPwLoading] = useState(false);

  // School Profile State
  const [schoolData, setSchoolData] = useState({
    name: "",
    code: "",
    contact_email: "",
    address: "",
    permitted_email_domain: "",
    timezone: "Asia/Kolkata",
    subscription_status: "",
    billing_cycle: "",
    whatsapp_gateway_mode: "shared",
    whatsapp_phone_number_id: "",
    whatsapp_business_account_id: "",
    whatsapp_access_token: "",
    whatsapp_api_key: "",
  });
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [savingSchool, setSavingSchool] = useState(false);

  // Academic Setup State
  const [academicYears, setAcademicYears] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicLoading, setAcademicLoading] = useState(false);

  // Modal forms state for Academic Setup
  const [showYearModal, setShowYearModal] = useState(false);
  const [newYear, setNewYear] = useState({ name: "", start_date: "", end_date: "", is_current: true });

  const [showClassModal, setShowClassModal] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", section: "" });

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", code: "" });

  useEffect(() => {
    if (activeTab === "permissions" && isAdmin) {
      fetchStaffPermissions();
    } else if (activeTab === "school" && isAdmin) {
      fetchSchoolProfile();
    } else if (activeTab === "academic" && isAdmin) {
      fetchAcademicData();
    }
  }, [activeTab, isAdmin]);

  // Fetch Staff Permissions
  const fetchStaffPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStaffPermissions();
      setAvailableModules(data.available_modules || []);
      setStaffList(data.staff || []);

      const initialMap = {};
      (data.staff || []).forEach((s) => {
        initialMap[s.id] = [...(s.granted_modules || [])];
      });
      setEditedPermissions(initialMap);
    } catch (err) {
      console.error("Failed to load staff permissions:", err);
      setError("Failed to load staff permissions list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch School Profile
  const fetchSchoolProfile = async () => {
    setSchoolLoading(true);
    setError(null);
    try {
      const data = await getSchoolProfile();
      setSchoolData({
        name: data.name || "",
        code: data.code || "",
        contact_email: data.contact_email || "",
        address: data.address || "",
        permitted_email_domain: data.permitted_email_domain || "",
        timezone: data.timezone || "Asia/Kolkata",
        subscription_status: data.subscription_status || "active",
        billing_cycle: data.billing_cycle || "annual",
        whatsapp_gateway_mode: data.whatsapp_gateway_mode || "shared",
        whatsapp_phone_number_id: data.whatsapp_phone_number_id || "",
        whatsapp_business_account_id: data.whatsapp_business_account_id || "",
        whatsapp_access_token: data.whatsapp_access_token || "",
        whatsapp_api_key: data.whatsapp_api_key || "",
      });
    } catch (err) {
      console.error("Failed to load school profile:", err);
      setError("Failed to load school profile settings.");
    } finally {
      setSchoolLoading(false);
    }
  };

  // Save School Profile
  const handleSaveSchoolProfile = async (e) => {
    e.preventDefault();
    setSavingSchool(true);
    setError(null);
    setSuccessMsg("");
    try {
      const updated = await updateSchoolProfile({
        name: schoolData.name,
        contact_email: schoolData.contact_email,
        address: schoolData.address,
        permitted_email_domain: schoolData.permitted_email_domain,
        timezone: schoolData.timezone,
        whatsapp_gateway_mode: schoolData.whatsapp_gateway_mode,
        whatsapp_phone_number_id: schoolData.whatsapp_phone_number_id,
        whatsapp_business_account_id: schoolData.whatsapp_business_account_id,
        whatsapp_access_token: schoolData.whatsapp_access_token,
        whatsapp_api_key: schoolData.whatsapp_api_key,
      });
      setSuccessMsg("School profile and WhatsApp gateway settings updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Failed to update school profile:", err);
      setError(err.response?.data?.detail || "Failed to update school profile.");
    } finally {
      setSavingSchool(false);
    }
  };

  // Fetch Academic Data
  const fetchAcademicData = async () => {
    setAcademicLoading(true);
    setError(null);
    try {
      const [years, classes, subs] = await Promise.all([
        getAcademicYears().catch(() => []),
        getClassSections().catch(() => []),
        getSubjects().catch(() => []),
      ]);
      setAcademicYears(Array.isArray(years) ? years : years.results || []);
      setClassSections(Array.isArray(classes) ? classes : classes.results || []);
      setSubjects(Array.isArray(subs) ? subs : subs.results || []);
    } catch (err) {
      console.error("Failed to load academic setup:", err);
      setError("Failed to load academic sessions or class data.");
    } finally {
      setAcademicLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!pwData.old_password || !pwData.new_password) {
      setError("Please fill in both current and new passwords.");
      return;
    }
    if (pwData.new_password !== pwData.confirm_password) {
      setError("New password and confirm password do not match.");
      return;
    }
    if (pwData.new_password.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setPwLoading(true);
    setError(null);
    setSuccessMsg("");

    try {
      await changePassword({
        old_password: pwData.old_password,
        new_password: pwData.new_password,
      });
      setSuccessMsg("Your password has been updated successfully!");
      setPwData({ old_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Password change failed:", err);
      setError(err.response?.data?.detail || "Failed to update password. Check your current password.");
    } finally {
      setPwLoading(false);
    }
  };

  // Handle Create Academic Year
  const handleCreateYear = async (e) => {
    e.preventDefault();
    try {
      const created = await createAcademicYear(newYear);
      setAcademicYears((prev) => [created, ...prev]);
      setShowYearModal(false);
      setNewYear({ name: "", start_date: "", end_date: "", is_current: true });
      setSuccessMsg("Academic year created successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError("Failed to create academic year.");
    }
  };

  // Handle Create Class Section
  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const created = await createClassSection(newClass);
      setClassSections((prev) => [created, ...prev]);
      setShowClassModal(false);
      setNewClass({ name: "", section: "" });
      setSuccessMsg("Class section created successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError("Failed to create class section.");
    }
  };

  // Handle Create Subject
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const created = await createSubject(newSubject);
      setSubjects((prev) => [created, ...prev]);
      setShowSubjectModal(false);
      setNewSubject({ name: "", code: "" });
      setSuccessMsg("Subject created successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError("Failed to create subject.");
    }
  };

  // Handle Staff Permissions
  const handleToggleModule = (staffId, moduleCode) => {
    setEditedPermissions((prev) => {
      const current = prev[staffId] || [];
      const updated = current.includes(moduleCode)
        ? current.filter((code) => code !== moduleCode)
        : [...current, moduleCode];
      return { ...prev, [staffId]: updated };
    });
  };

  const handleGrantAll = (staffId) => {
    const allCodes = availableModules.map((m) => m.code);
    setEditedPermissions((prev) => ({ ...prev, [staffId]: allCodes }));
  };

  const handleRevokeAll = (staffId) => {
    setEditedPermissions((prev) => ({ ...prev, [staffId]: [] }));
  };

  const handleSavePermission = async (staffMember) => {
    setSavingStaffId(staffMember.id);
    setSuccessMsg("");
    setError(null);

    const modulesToSave = editedPermissions[staffMember.id] || [];

    try {
      const res = await updateStaffPermission(staffMember.id, modulesToSave);
      setSuccessMsg(`Permissions updated successfully for ${staffMember.full_name}!`);

      setStaffList((prev) =>
        prev.map((s) =>
          s.id === staffMember.id
            ? { ...s, granted_modules: res.granted_modules, updated_at: res.updated_at }
            : s
        )
      );

      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Failed to save permissions:", err);
      setError(err.response?.data?.detail || "Failed to update module permissions.");
    } finally {
      setSavingStaffId(null);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.designation?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "ALL" || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const staffWithDelegatedCount = staffList.filter(
    (s) => s.granted_modules && s.granted_modules.length > 0
  ).length;

  const userModulePermissions = profile?.module_permissions || [];

  return (
    <div className="w-full max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="pb-4 border-b border-cn-border mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2.5">
            Settings
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">
            Manage your profile, security, school branding, academic sessions &amp; staff permissions
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap border-b border-cn-border mb-6 gap-1">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition-all ${
            activeTab === "profile"
              ? "border-violet-600 text-violet-900 bg-violet-50/50 rounded-t-lg"
              : "border-transparent text-ink-500 hover:text-ink-900"
          }`}
        >
          <User size={16} />
          Profile &amp; Permissions
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition-all ${
            activeTab === "security"
              ? "border-violet-600 text-violet-900 bg-violet-50/50 rounded-t-lg"
              : "border-transparent text-ink-500 hover:text-ink-900"
          }`}
        >
          <KeyRound size={16} />
          Password &amp; Security
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab("school")}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition-all ${
              activeTab === "school"
                ? "border-violet-600 text-violet-900 bg-violet-50/50 rounded-t-lg"
                : "border-transparent text-ink-500 hover:text-ink-900"
            }`}
          >
            <Building2 size={16} />
            School Profile &amp; Branding
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab("academic")}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition-all ${
              activeTab === "academic"
                ? "border-violet-600 text-violet-900 bg-violet-50/50 rounded-t-lg"
                : "border-transparent text-ink-500 hover:text-ink-900"
            }`}
          >
            <GraduationCap size={16} />
            Academic Sessions &amp; Classes
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab("permissions")}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition-all ${
              activeTab === "permissions"
                ? "border-violet-600 text-violet-900 bg-violet-50/50 rounded-t-lg"
                : "border-transparent text-ink-500 hover:text-ink-900"
            }`}
          >
            <ShieldCheck size={16} />
            Staff Permissions Manager
          </button>
        )}
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: YOUR PROFILE & ACTIVE PERMISSIONS */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-cn-surface border border-cn-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 pb-5 border-b border-cn-border">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                {(profile?.full_name || profile?.user?.first_name || profile?.user?.username || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <h2 className="font-heading font-semibold text-lg text-ink-900">
                  {profile?.full_name ||
                    [profile?.user?.first_name, profile?.user?.last_name].filter(Boolean).join(" ") ||
                    profile?.user?.username ||
                    "User"}
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800 mt-1">
                  {roleName}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 text-[13.5px] pt-5">
              <div className="flex justify-between border-b border-cn-border pb-2.5">
                <span className="text-ink-500">Username</span>
                <span className="font-medium text-ink-900">
                  {profile?.user?.username || profile?.username || "—"}
                </span>
              </div>
              <div className="flex justify-between border-b border-cn-border pb-2.5">
                <span className="text-ink-500">Email</span>
                <span className="font-medium text-ink-900">
                  {profile?.user?.email || profile?.email || "—"}
                </span>
              </div>
              {profile?.employee_id && (
                <div className="flex justify-between border-b border-cn-border pb-2.5">
                  <span className="text-ink-500">Employee ID</span>
                  <span className="font-medium text-ink-900">{profile.employee_id}</span>
                </div>
              )}
              {profile?.teacher_profile?.designation && (
                <div className="flex justify-between border-b border-cn-border pb-2.5">
                  <span className="text-ink-500">Designation</span>
                  <span className="font-medium text-ink-900">{profile.teacher_profile.designation}</span>
                </div>
              )}
              <div className="flex justify-between pb-1">
                <span className="text-ink-500">Tenant School</span>
                <span className="font-medium text-ink-900">{profile?.tenant || "Default"}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-cn-surface border border-cn-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-cn-border">
              <div>
                <h2 className="font-heading font-semibold text-lg text-ink-900 flex items-center gap-2">
                  <BadgeCheck className="text-violet-600" size={20} />
                  Your Active Module Permissions
                </h2>
                <p className="text-ink-500 text-[12.5px] mt-0.5">
                  Modules you currently have access to interact with in the portal
                </p>
              </div>
              {isAdmin && (
                <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold">
                  Full Admin Access
                </span>
              )}
            </div>

            {isAdmin ? (
              <div className="p-4 bg-violet-50/70 border border-violet-200 rounded-xl mb-4 text-xs text-violet-900 flex items-start gap-2.5">
                <Info size={16} className="text-violet-600 shrink-0 mt-0.5" />
                <span>
                  As a <strong>{roleName}</strong>, you have full administrative permission across all school modules and can allocate specific module permissions to teachers or staff members in the Staff Permissions Manager tab.
                </span>
              </div>
            ) : userModulePermissions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {userModulePermissions.map((mod) => (
                  <div
                    key={mod.code}
                    className="flex items-center justify-between p-3 bg-cn-surface border border-emerald-200/80 bg-emerald-50/30 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <Check size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-ink-900 text-xs">{mod.label}</div>
                        <div className="text-[11px] text-ink-400 font-mono">/api/{mod.code}/</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10.5px] font-semibold">
                      Granted
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                <Lock size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-semibold text-gray-700">No Delegated Module Permissions</p>
                <p className="text-xs text-gray-500 mt-1">
                  You currently have standard base role access. Ask your School Principal or Admin if you require delegated module permissions.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PASSWORD & SECURITY */}
      {activeTab === "security" && (
        <div className="max-w-xl bg-cn-surface border border-cn-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-ink-900">Change Password</h2>
              <p className="text-xs text-ink-500">Update your login account password securely</p>
            </div>
          </div>

          <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={pwData.old_password}
                onChange={(e) => setPwData({ ...pwData, old_password: e.target.value })}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={pwData.new_password}
                onChange={(e) => setPwData({ ...pwData, new_password: e.target.value })}
                placeholder="Enter new password (min. 6 chars)"
                className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={pwData.confirm_password}
                onChange={(e) => setPwData({ ...pwData, confirm_password: e.target.value })}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pwLoading}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-violet-600/20 transition-all disabled:opacity-50"
              >
                {pwLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SCHOOL PROFILE & BRANDING (ADMIN) */}
      {isAdmin && activeTab === "school" && (
        <div className="max-w-3xl bg-cn-surface border border-cn-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-ink-900">School Profile &amp; Branding</h2>
              <p className="text-xs text-ink-500">Configure institution details, contact email, timezone &amp; domain rules</p>
            </div>
          </div>

          {schoolLoading ? (
            <div className="p-8 text-center">
              <div className="w-7 h-7 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-ink-600 font-semibold">Loading school profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveSchoolProfile} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">School / Institution Name</label>
                  <input
                    type="text"
                    required
                    value={schoolData.name}
                    onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
                    placeholder="e.g. Vidyam Public School"
                    className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">School Code (Unique)</label>
                  <input
                    type="text"
                    disabled
                    value={schoolData.code}
                    className="w-full px-3.5 py-2 text-xs bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Official Contact Email</label>
                  <input
                    type="email"
                    value={schoolData.contact_email}
                    onChange={(e) => setSchoolData({ ...schoolData, contact_email: e.target.value })}
                    placeholder="e.g. admin@school.edu.in"
                    className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Permitted Staff Email Domain</label>
                  <input
                    type="text"
                    value={schoolData.permitted_email_domain}
                    onChange={(e) => setSchoolData({ ...schoolData, permitted_email_domain: e.target.value })}
                    placeholder="e.g. school.edu.in (optional)"
                    className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Campus Address</label>
                <textarea
                  rows={3}
                  value={schoolData.address}
                  onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                  placeholder="Enter full campus address..."
                  className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Timezone</label>
                  <select
                    value={schoolData.timezone}
                    onChange={(e) => setSchoolData({ ...schoolData, timezone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Subscription Status</label>
                  <div className="px-3.5 py-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold capitalize flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    {schoolData.subscription_status} ({schoolData.billing_cycle})
                  </div>
                </div>
              </div>
              {/* WhatsApp Gateway Integration Section */}
              <div className="mt-4 pt-5 border-t border-cn-border">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="text-emerald-600" size={18} />
                  <div>
                    <h3 className="font-heading font-semibold text-sm text-ink-900">WhatsApp Gateway &amp; Messaging Integration</h3>
                    <p className="text-[11.5px] text-ink-500">Configure whether to send automated messages via Vidyam's default gateway or your school's own WhatsApp Business API</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1">WhatsApp Gateway Mode</label>
                    <select
                      value={schoolData.whatsapp_gateway_mode}
                      onChange={(e) => setSchoolData({ ...schoolData, whatsapp_gateway_mode: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500"
                    >
                      <option value="shared">Polynexus / Vidyam Default Account (Shared Gateway - Zero Setup)</option>
                      <option value="meta_cloud">Meta Cloud API (Custom School WhatsApp Business Account)</option>
                      <option value="interakt">Interakt WhatsApp API</option>
                      <option value="wati">Wati WhatsApp API</option>
                    </select>
                  </div>

                  {schoolData.whatsapp_gateway_mode === "shared" ? (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2 shrink-0 self-center">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Default Shared Gateway Active:</strong> All automated WhatsApp notifications (attendance, fee reminders, bus alerts) will be dispatched from Polynexus / Vidyam's official verified WhatsApp business channel.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">Phone Number ID / Sender Number</label>
                      <input
                        type="text"
                        value={schoolData.whatsapp_phone_number_id}
                        onChange={(e) => setSchoolData({ ...schoolData, whatsapp_phone_number_id: e.target.value })}
                        placeholder="e.g. 1029384756102"
                        className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>
                  )}
                </div>

                {schoolData.whatsapp_gateway_mode !== "shared" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">WhatsApp Business Account ID (WABA)</label>
                      <input
                        type="text"
                        value={schoolData.whatsapp_business_account_id}
                        onChange={(e) => setSchoolData({ ...schoolData, whatsapp_business_account_id: e.target.value })}
                        placeholder="e.g. 9876543210123"
                        className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1">Permanent Access Token / API Key</label>
                      <input
                        type="password"
                        value={schoolData.whatsapp_access_token}
                        onChange={(e) => setSchoolData({ ...schoolData, whatsapp_access_token: e.target.value })}
                        placeholder="Enter WABA access token or API secret key"
                        className="w-full px-3.5 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSchool}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-violet-600/20 transition-all disabled:opacity-50"
                >
                  {savingSchool ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Save School Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 4: ACADEMIC SESSIONS & CLASSES (ADMIN) */}
      {isAdmin && activeTab === "academic" && (
        <div className="flex flex-col gap-6">
          {/* Academic Years Card */}
          <div className="bg-cn-surface border border-cn-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-cn-border mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-base text-ink-900">Academic Years</h2>
                  <p className="text-xs text-ink-500">Configure academic sessions and session boundaries</p>
                </div>
              </div>
              <button
                onClick={() => setShowYearModal(true)}
                className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Plus size={15} />
                Add Academic Year
              </button>
            </div>

            {academicYears.length === 0 ? (
              <p className="text-xs text-ink-400 italic">No academic years defined yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {academicYears.map((ay) => (
                  <div key={ay.id} className="p-3.5 bg-cn-bg border border-cn-border rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-ink-900">{ay.name}</div>
                      <div className="text-[11px] text-ink-500 mt-0.5">
                        {ay.start_date || "N/A"} to {ay.end_date || "N/A"}
                      </div>
                    </div>
                    {ay.is_current && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10.5px] font-semibold rounded">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Class Sections Card */}
          <div className="bg-cn-surface border border-cn-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-cn-border mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-base text-ink-900">Class Sections ({classSections.length})</h2>
                  <p className="text-xs text-ink-500">Active class sections configured for student &amp; attendance management</p>
                </div>
              </div>
              <button
                onClick={() => setShowClassModal(true)}
                className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Plus size={15} />
                Add Class Section
              </button>
            </div>

            {classSections.length === 0 ? (
              <p className="text-xs text-ink-400 italic">No class sections configured yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {classSections.map((cs) => (
                  <div key={cs.id} className="p-3 bg-cn-bg border border-cn-border rounded-xl">
                    <div className="font-bold text-xs text-violet-950">
                      {cs.display_name || `${cs.name} - ${cs.section}`}
                    </div>
                    <div className="text-[11px] text-ink-500 mt-0.5 truncate">
                      Homeroom: {cs.class_teacher_name || "Unassigned"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subjects Card */}
          <div className="bg-cn-surface border border-cn-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-cn-border mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-base text-ink-900">Subjects ({subjects.length})</h2>
                  <p className="text-xs text-ink-500">Curriculum subject catalog for syllabus, timetable &amp; exam paper setting</p>
                </div>
              </div>
              <button
                onClick={() => setShowSubjectModal(true)}
                className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Plus size={15} />
                Add Subject
              </button>
            </div>

            {subjects.length === 0 ? (
              <p className="text-xs text-ink-400 italic">No subjects added yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {subjects.map((sub) => (
                  <div key={sub.id} className="p-3 bg-cn-bg border border-cn-border rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-ink-900">{sub.name}</div>
                      <div className="text-[11px] font-mono text-ink-400">{sub.code}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STAFF MODULE PERMISSIONS MANAGER (ADMIN ONLY) */}
      {isAdmin && activeTab === "permissions" && (
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-gradient-to-r from-violet-900 to-indigo-900 text-white rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={20} className="text-violet-200" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-base text-white">
                  Delegate Workload &amp; Module Permissions
                </h3>
                <p className="text-violet-200 text-xs mt-0.5 max-w-2xl">
                  Allocate specific module access (Fees, Gate Passes, Transfer Certificates, Infirmary, Inventory, etc.) to teachers or staff members. Permissions take effect immediately.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-1.5 bg-white/10 rounded-xl text-xs font-semibold border border-white/20">
                Staff count: {staffList.length}
              </div>
              <div className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-200 rounded-xl text-xs font-semibold border border-emerald-400/30">
                Delegated: {staffWithDelegatedCount}
              </div>
            </div>
          </div>

          <div className="bg-cn-surface border border-cn-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                type="text"
                placeholder="Search staff by name, ID, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="text-xs text-ink-500 font-medium shrink-0">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="Teacher">Teacher</option>
                <option value="School Admin">School Admin</option>
                <option value="Management">Management</option>
                <option value="Conductor">Conductor</option>
              </select>

              <button
                onClick={fetchStaffPermissions}
                title="Refresh staff list"
                className="p-2 text-ink-600 hover:text-violet-700 bg-cn-bg border border-cn-border rounded-xl cursor-pointer hover:bg-violet-50 transition-all"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-cn-surface border border-cn-border rounded-2xl">
              <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-semibold text-ink-700">Loading staff members &amp; permissions...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-12 text-center bg-cn-surface border border-cn-border rounded-2xl">
              <UserCheck size={36} className="mx-auto text-ink-300 mb-3" />
              <p className="text-base font-semibold text-ink-700">No staff members found</p>
              <p className="text-xs text-ink-400 mt-1">Try adjusting your search query or filter.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {filteredStaff.map((staffMember) => {
                const currentEdited = editedPermissions[staffMember.id] || [];
                const originalGranted = staffMember.granted_modules || [];
                const isModified =
                  JSON.stringify([...currentEdited].sort()) !==
                  JSON.stringify([...originalGranted].sort());

                const isSavingThis = savingStaffId === staffMember.id;

                return (
                  <div
                    key={staffMember.id}
                    className={`bg-cn-surface border rounded-2xl p-5 shadow-sm transition-all ${
                      isModified
                        ? "border-violet-400 ring-2 ring-violet-400/20"
                        : "border-cn-border hover:border-violet-200"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cn-border">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-800 font-bold text-base flex items-center justify-center shrink-0">
                          {staffMember.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading font-semibold text-base text-ink-900">
                              {staffMember.full_name}
                            </h3>
                            <span className="px-2 py-0.5 bg-violet-50 text-violet-800 border border-violet-200 rounded-md text-[11px] font-semibold">
                              {staffMember.role}
                            </span>
                            {staffMember.designation && (
                              <span className="text-xs text-ink-400">
                                ({staffMember.designation})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-ink-500 mt-0.5">
                            {staffMember.employee_id && (
                              <span>ID: <strong>{staffMember.employee_id}</strong></span>
                            )}
                            {staffMember.email && <span>{staffMember.email}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          type="button"
                          onClick={() => handleGrantAll(staffMember.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl cursor-pointer transition-all"
                        >
                          Grant All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevokeAll(staffMember.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer transition-all"
                        >
                          Revoke All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSavePermission(staffMember)}
                          disabled={isSavingThis || !isModified}
                          className={`px-4 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                            isModified
                              ? "bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                          }`}
                        >
                          {isSavingThis ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={14} />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 pb-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-ink-500 font-semibold mr-1">
                        Active Delegated Access ({currentEdited.length}):
                      </span>
                      {currentEdited.length === 0 ? (
                        <span className="text-xs text-ink-400 italic">No delegated modules</span>
                      ) : (
                        currentEdited.map((code) => {
                          const label =
                            availableModules.find((m) => m.code === code)?.label || code;
                          return (
                            <span
                              key={code}
                              className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-1"
                            >
                              <Check size={12} className="text-emerald-600" />
                              {label}
                            </span>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-cn-border">
                      <div className="text-xs font-semibold text-ink-700 mb-2.5">
                        Toggle Module Access:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                        {availableModules.map((mod) => {
                          const isChecked = currentEdited.includes(mod.code);

                          return (
                            <label
                              key={mod.code}
                              onClick={() => handleToggleModule(staffMember.id, mod.code)}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                                isChecked
                                  ? "bg-violet-50/70 border-violet-300 text-violet-950 font-semibold shadow-xs"
                                  : "bg-cn-bg border-cn-border text-ink-600 hover:border-gray-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                              />
                              <span className="truncate">{mod.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Academic Year */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-cn-surface border border-cn-border rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-cn-border mb-4">
              <h3 className="font-heading font-semibold text-base text-ink-900">Add Academic Year</h3>
              <button onClick={() => setShowYearModal(false)} className="text-ink-400 hover:text-ink-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateYear} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Session Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-2027"
                  value={newYear.name}
                  onChange={(e) => setNewYear({ ...newYear, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newYear.start_date}
                    onChange={(e) => setNewYear({ ...newYear, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newYear.end_date}
                    onChange={(e) => setNewYear({ ...newYear, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-cn-border">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-ink-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm"
                >
                  Save Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Class Section */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-cn-surface border border-cn-border rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-cn-border mb-4">
              <h3 className="font-heading font-semibold text-base text-ink-900">Add Class Section</h3>
              <button onClick={() => setShowClassModal(false)} className="text-ink-400 hover:text-ink-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Section</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A"
                  value={newClass.section}
                  onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-cn-border">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-ink-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm"
                >
                  Save Class Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Subject */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-cn-surface border border-cn-border rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-cn-border mb-4">
              <h3 className="font-heading font-semibold text-base text-ink-900">Add Subject</h3>
              <button onClick={() => setShowSubjectModal(false)} className="text-ink-400 hover:text-ink-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubject} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MATH101"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-cn-bg border border-cn-border rounded-xl text-ink-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-cn-border">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-ink-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

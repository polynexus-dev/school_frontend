import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Send, MessageSquare } from "lucide-react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import messagingService from "../services/messagingService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const timeLabel = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString();
};

const Messages = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isParent = roleName === "Parent";

  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const [showNewModal, setShowNewModal] = useState(false);
  const [children, setChildren] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [newForm, setNewForm] = useState({ student: "", teacher: "" });
  const [creating, setCreating] = useState(false);

  const loadThreads = async () => {
    setLoadingThreads(true);
    try {
      const res = await messagingService.getThreads();
      setThreads(asList(res.data));
    } catch (err) {
      console.error("Failed to load message threads:", err);
      toast.error("Failed to load conversations.");
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const openThread = async (thread) => {
    setActiveThread(thread);
    setLoadingMessages(true);
    try {
      const res = await messagingService.getMessages(thread.id);
      setMessages(asList(res.data));
      loadThreads(); // refresh unread badges
    } catch (err) {
      console.error("Failed to load messages:", err);
      toast.error("Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!draft.trim() || !activeThread) return;
    setSending(true);
    try {
      const res = await messagingService.sendMessage(activeThread.id, draft.trim());
      setMessages((prev) => [...prev, res.data]);
      setDraft("");
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error(err?.response?.data?.detail || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const openNewModal = async () => {
    setNewForm({ student: "", teacher: "" });
    setTeachers([]);
    setShowNewModal(true);
    try {
      const res = await messagingService.getMyChildren();
      setChildren(asList(res.data));
    } catch (err) {
      console.error("Failed to load children:", err);
      toast.error("Failed to load your linked children.");
    }
  };

  const handleStudentChange = async (studentId) => {
    setNewForm({ student: studentId, teacher: "" });
    if (!studentId) return;
    try {
      const res = await messagingService.getEligibleTeachers(studentId);
      setTeachers(res.data);
    } catch (err) {
      console.error("Failed to load eligible teachers:", err);
      toast.error("Failed to load teachers for this child.");
    }
  };

  const handleCreateThread = async () => {
    if (!newForm.student || !newForm.teacher) {
      toast.error("Pick a child and a teacher.");
      return;
    }
    setCreating(true);
    try {
      const res = await messagingService.createThread({ student: Number(newForm.student), teacher: Number(newForm.teacher) });
      toast.success("Conversation started.");
      setShowNewModal(false);
      await loadThreads();
      openThread(res.data);
    } catch (err) {
      console.error("Failed to start thread:", err);
      toast.error(err?.response?.data?.teacher?.[0] || err?.response?.data?.detail || "Failed to start conversation.");
    } finally {
      setCreating(false);
    }
  };

  const childOptions = useMemo(
    () => children.map((link) => ({ label: link.student_name || link.student_detail?.full_name, value: String(link.student) })),
    [children]
  );
  const teacherOptions = useMemo(() => teachers.map((t) => ({ label: t.name, value: String(t.id) })), [teachers]);
  const teacherPlaceholder = teachers.length ? [] : [{ label: "Pick a child first", value: "" }];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Messages</h1>
          <p className="text-ink-500 text-[13px] mt-1">{isParent ? "Talk directly with your child's teachers" : "Conversations with parents"}</p>
        </div>
        {isParent && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={openNewModal}>
            New conversation
          </Button>
        )}
      </div>

      <div className="flex gap-4 h-[600px]">
        <div className="w-72 shrink-0 bg-cn-surface border border-cn-border rounded-2xl overflow-y-auto">
          {loadingThreads ? (
            <p className="text-center text-ink-400 text-[13px] py-8">Loading…</p>
          ) : threads.length === 0 ? (
            <p className="text-center text-ink-400 text-[13px] py-8 px-4">No conversations yet.</p>
          ) : (
            threads.map((t) => (
              <div
                key={t.id}
                onClick={() => openThread(t)}
                className={`px-4 py-3 border-b border-cn-border cursor-pointer hover:bg-violet-50/60 ${activeThread?.id === t.id ? "bg-violet-50" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-bold text-ink-900 truncate">{isParent ? t.teacher_name : t.guardian_name}</span>
                  {t.unread_count > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {t.unread_count}
                    </span>
                  )}
                </div>
                <div className="text-[11.5px] text-ink-500 mt-0.5">Re: {t.student_name}</div>
                {t.last_message && <div className="text-[12px] text-ink-400 mt-1 truncate">{t.last_message.body}</div>}
              </div>
            ))
          )}
        </div>

        <div className="flex-1 bg-cn-surface border border-cn-border rounded-2xl flex flex-col overflow-hidden">
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-ink-400 gap-2">
              <MessageSquare size={28} />
              <p className="text-[13px]">Select a conversation to view messages</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-cn-border">
                <div className="text-[14px] font-bold text-ink-900">{isParent ? activeThread.teacher_name : activeThread.guardian_name}</div>
                <div className="text-[12px] text-ink-500">About {activeThread.student_name}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                {loadingMessages ? (
                  <p className="text-center text-ink-400 text-[13px]">Loading…</p>
                ) : (
                  messages.map((m) => {
                    // Profile shapes differ enough between roles that a sender-id
                    // comparison isn't available for Parents — comparing the
                    // sender's name against "the other party's name" on this
                    // thread is simpler and sufficient (a thread only ever has
                    // two participants).
                    const otherPartyName = isParent ? activeThread.teacher_name : activeThread.guardian_name;
                    const mine = m.sender_name !== otherPartyName;
                    return (
                      <div key={m.id} className={`max-w-[70%] ${mine ? "self-end" : "self-start"}`}>
                        <div className={`rounded-2xl px-3.5 py-2 text-[13px] ${mine ? "bg-violet-600 text-white" : "bg-cn-bg text-ink-900"}`}>{m.body}</div>
                        <div className={`text-[10.5px] text-ink-400 mt-1 ${mine ? "text-right" : ""}`}>{m.sender_name} · {timeLabel(m.sent_at)}</div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-3 border-t border-cn-border flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message…"
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl bg-transparent text-[13px] outline-none focus:border-violet-500"
                />
                <Button variant="primary" icon={<Send size={15} />} onClick={handleSend} loading={sending} disabled={!draft.trim()} aria-label="Send message" />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Start a new conversation">
        <div className="flex flex-col gap-3 w-[340px] max-w-full">
          <SelectBox label="Child" fieldName="student" value={newForm.student} onChange={(e) => handleStudentChange(e.target.value)} options={childOptions} />
          <SelectBox
            label="Teacher"
            fieldName="teacher"
            value={newForm.teacher}
            onChange={(e) => setNewForm((p) => ({ ...p, teacher: e.target.value }))}
            options={[...teacherPlaceholder, ...teacherOptions]}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateThread} loading={creating}>
              Start
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Messages;

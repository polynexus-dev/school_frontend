import React from "react";
import useUser from "../../auth/hooks/useUser";

// Lightweight placeholder — Settings isn't one of the 6 School Edition design
// screens; shows the current profile from GET /api/profile/ (already fetched
// app-wide by UserProvider) so the page isn't completely empty.
const Settings = () => {
  const { user } = useUser();
  const profile = user?.data;

  return (
    <div className="w-full">
      <div className="pb-4 border-b border-cn-border mb-6">
        <h1 className="font-heading font-bold text-2xl text-violet-950">Settings</h1>
        <p className="text-ink-500 text-[13px] mt-1">School &amp; account settings</p>
      </div>

      <div className="bg-cn-surface border border-cn-border rounded-2xl p-6 max-w-xl">
        <h2 className="font-heading font-semibold text-base text-ink-900 mb-4">Your profile</h2>
        <div className="flex flex-col gap-3 text-[13.5px]">
          <div className="flex justify-between border-b border-cn-border pb-2">
            <span className="text-ink-500">Name</span>
            <span className="font-semibold text-ink-900">{profile?.full_name || profile?.username || "—"}</span>
          </div>
          <div className="flex justify-between border-b border-cn-border pb-2">
            <span className="text-ink-500">Email</span>
            <span className="font-semibold text-ink-900">{profile?.email || "—"}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-ink-500">Role</span>
            <span className="font-semibold text-ink-900">{profile?.role || "Admin"}</span>
          </div>
        </div>
        <p className="text-xs text-ink-400 mt-5">
          School branding, notification preferences and security settings are on the roadmap.
        </p>
      </div>
    </div>
  );
};

export default Settings;

import React from "react";
import { Wallet } from "lucide-react";

// Nav item exists (design has a "Fees" sidebar entry) but Fees isn't one of
// the 6 School Edition design screens and there's no fees endpoint in the
// confirmed contract yet — kept as a lightweight placeholder so the route
// doesn't 404.
const Fees = () => {
  return (
    <div className="w-full">
      <div className="pb-4 border-b border-cn-border mb-6">
        <h1 className="font-heading font-bold text-2xl text-violet-950">Fees</h1>
        <p className="text-ink-500 text-[13px] mt-1">Fee collection &amp; invoices</p>
      </div>
      <div className="bg-cn-surface border border-cn-border rounded-2xl p-10 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center">
          <Wallet size={22} />
        </div>
        <h2 className="font-heading font-semibold text-lg text-ink-900">Fee module coming soon</h2>
        <p className="text-[13px] text-ink-500 max-w-md">
          Fee structures, invoices and Razorpay-first payments are on the roadmap — the backend contract for this
          module hasn't been confirmed yet.
        </p>
      </div>
    </div>
  );
};

export default Fees;

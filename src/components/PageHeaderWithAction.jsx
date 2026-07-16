import React from "react";
import Button from "./Button";
import { Plus } from "lucide-react";

const PageHeaderWithAction = ({
  title,
  subtitle,
  onCreateClick,
  buttonLabel = "Create",
  button = true,
  children,
}) => {
  return (
    <div className="flex justify-between items-center border-b border-b-divider pb-3 mb-6 flex-wrap gap-3">
      <div>
        <h2 className="font-heading text-xl text-primary font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-ink-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {button && (
          <Button variant="primary" className="flex items-center gap-1" onClick={onCreateClick}>
            <Plus size={16} />
            {buttonLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageHeaderWithAction;

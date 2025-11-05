import React from "react";

interface ToolbarTab {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

interface OnlyOfficeLikeToolbarProps {
  tabs: ToolbarTab[];
  activeTab: string;
  onTabChange: (label: string) => void;
  rightContent?: React.ReactNode;
}

export const OnlyOfficeLikeToolbar: React.FC<OnlyOfficeLikeToolbarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  rightContent,
}) => {
  return (
    <div className="w-full flex items-center bg-[#23272b] text-white h-10 border-b border-neutral-800 select-none">
      <div className="flex gap-1 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            className={`px-3 py-1 rounded-t-md text-sm font-medium transition-colors duration-100 ${
              tab.active || activeTab === tab.label
                ? "bg-[#23272b] text-white border-b-2 border-primary"
                : "bg-transparent text-neutral-300 hover:bg-neutral-700"
            }`}
            onClick={() => onTabChange(tab.label)}
            style={{ outline: "none", border: "none" }}
          >
            {tab.icon && <span className="mr-1">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      {rightContent && <div className="pr-4">{rightContent}</div>}
    </div>
  );
};

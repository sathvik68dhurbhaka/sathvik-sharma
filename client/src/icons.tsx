import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
}

const createIcon = (d: string | string[], viewBox = "0 0 24 24") => {
  return ({ size = 20, color = "currentColor", className = "", ...props }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
    </svg>
  );
};

export const GraduationCap = createIcon([
  "M22 10v6M2 10l10-5 10 5-10 5z",
  "M6 12v5c3 3 9 3 12 0v-5"
]);
export const Mail = createIcon([
  "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z",
  "M22 6l-10 7L2 6"
]);
export const Lock = createIcon([
  "M7 11V7a5 5 0 0 1 10 0v4",
  "M4 11h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z"
]);
export const User = createIcon([
  "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
  "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
]);
export const UserIcon = User;
export const AlertCircle = createIcon([
  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  "M12 8v4",
  "M12 16h.01"
]);
export const ArrowRight = createIcon([
  "M5 12h14",
  "M12 5l7 7-7 7"
]);
export const ArrowLeft = createIcon([
  "M19 12H5",
  "M12 19l-7-7 7-7"
]);
export const Shield = createIcon([
  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
]);
export const ShieldAlert = createIcon([
  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  "M12 8v4",
  "M12 16h.01"
]);
export const CheckCircle2 = createIcon([
  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  "M9 12l2 2 4-4"
]);
export const CheckCircle = CheckCircle2;
export const KeyRound = createIcon([
  "M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4L2 14v4h2v2h2v-2z",
  "M16.5 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
]);
export const BookOpen = createIcon([
  "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z",
  "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
]);
export const Calendar = createIcon([
  "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z",
  "M16 2v4",
  "M8 2v4",
  "M3 10h18"
]);
export const Clock = createIcon([
  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  "M12 6v6l4 2"
]);
export const Sparkles = createIcon([
  "M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"
]);
export const TrendingUp = createIcon([
  "M23 6l-9.5 9.5-5-5L1 18",
  "M17 6h6v6"
]);
export const Target = createIcon([
  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  "M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
  "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
]);
export const Bell = createIcon([
  "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9",
  "M13.73 21a2 2 0 0 1-3.46 0"
]);
export const Settings = createIcon([
  "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
]);
export const LogOut = createIcon([
  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
  "M16 17l5-5-5-5",
  "M21 12H9"
]);
export const Plus = createIcon([
  "M12 5v14",
  "M5 12h14"
]);
export const Trash2 = createIcon([
  "M3 6h18",
  "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
  "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  "M10 11v6",
  "M14 11v6"
]);
export const Edit3 = createIcon([
  "M12 20h9",
  "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
]);
export const Edit = Edit3;
export const Users = createIcon([
  "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
  "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  "M23 21v-2a4 4 0 0 0-3-3.87",
  "M16 3.13a4 4 0 0 1 0 7.75"
]);
export const History = createIcon([
  "M1 4v6h6",
  "M3.51 15a9 9 0 1 0 2.13-9.36L1 10"
]);
export const Download = createIcon([
  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
  "M7 10l5 5 5-5",
  "M12 15V3"
]);
export const Search = createIcon([
  "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  "M21 21l-4.35-4.35"
]);
export const Filter = createIcon([
  "M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
]);
export const Send = createIcon([
  "M22 2L11 13",
  "M22 2l-7 20-4-9-9-4 20-7z"
]);
export const HelpCircle = createIcon([
  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
  "M12 17h.01"
]);
export const ChevronRight = createIcon([
  "M9 18l6-6-6-6"
]);
export const ChevronLeft = createIcon([
  "M15 18l-6-6 6-6"
]);
export const ChevronDown = createIcon([
  "M6 9l6 6 6-6"
]);
export const Award = createIcon([
  "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z",
  "M8.21 13.89L7 23l5-3 5 3-1.21-9.12"
]);
export const Check = createIcon([
  "M20 6L9 17l-5-5"
]);
export const X = createIcon([
  "M18 6L6 18",
  "M6 6l12 12"
]);
export const Flame = createIcon([
  "M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.6-.2-1.15-.5-1.6L12 11l-1 1.9c-.3.45-.5 1-.5 1.6z",
  "M12 2c5 4.5 8 8.5 8 13a8 8 0 1 1-16 0c0-4.5 3-8.5 8-13z"
]);
export const RefreshCw = createIcon([
  "M23 4v6h-6",
  "M1 20v-6h6",
  "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
]);
export const Play = createIcon([
  "M5 3l14 9-14 9V3z"
]);
export const FileText = createIcon([
  "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
  "M14 2v6h6",
  "M16 13H8",
  "M16 17H8",
  "M10 9H8"
]);
export const BarChart2 = createIcon([
  "M18 20V10",
  "M12 20V4",
  "M6 20v-6"
]);
export const BarChart3 = BarChart2;
export const LayoutDashboard = createIcon([
  "M3 3h7v7H3z",
  "M14 3h7v7h-7z",
  "M14 14h7v7h-7z",
  "M3 14h7v7H3z"
]);
export const Brain = createIcon([
  "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04z",
  "M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04z"
]);
export const Sun = createIcon([
  "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
  "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"
]);
export const Moon = createIcon([
  "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
]);
export const Copy = createIcon([
  "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z",
  "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
]);
export const ExternalLink = createIcon([
  "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  "M15 3h6v6",
  "M10 14L21 3"
]);
export const ListTodo = createIcon([
  "M11 12h10",
  "M11 18h10",
  "M11 6h10",
  "M3 12l2 2 4-4",
  "M3 6l2 2 4-4"
]);
export const PieChart = createIcon([
  "M21.21 15.89A10 10 0 1 1 8 2.83",
  "M22 12A10 10 0 0 0 12 2v10z"
]);
export const Activity = createIcon([
  "M22 12h-4l-3 9L9 3l-3 9H2"
]);
export const MessageSquare = createIcon([
  "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
]);

// Newly added icons
export const AlertTriangle = createIcon([
  "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  "M12 9v4",
  "M12 17h.01"
]);
export const Info = createIcon([
  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  "M12 16v-4",
  "M12 8h.01"
]);
export const CalendarDays = Calendar;
export const ClipboardList = createIcon([
  "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
  "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z",
  "M12 11h4",
  "M12 16h4",
  "M8 11h.01",
  "M8 16h.01"
]);
export const Bot = Brain;
export const UserCheck = createIcon([
  "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
  "M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  "M17 11l2 2 4-4"
]);
export const XCircle = createIcon([
  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  "M15 9l-6 6",
  "M9 9l6 6"
]);
export const ArrowUpRight = createIcon([
  "M7 17L17 7",
  "M7 7h10v10"
]);
export const ShieldOff = createIcon([
  "M12 2L3 6v6c0 5.55 3.84 10.74 9 12 1.34-.33 2.58-.87 3.68-1.57",
  "M1 1l22 22"
]);
export const UserX = createIcon([
  "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
  "M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  "M18 8l5 5",
  "M23 8l-5 5"
]);
export const Eye = createIcon([
  "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
]);
export const Lightbulb = createIcon([
  "M9 18h6",
  "M10 22h4",
  "M15 9a3 3 0 0 0-6 0c0 2 1.5 3.5 1.5 5h3C13.5 12.5 15 11 15 9z"
]);
export const RotateCw = RefreshCw;
export const RotateCcw = createIcon([
  "M1 4v6h6",
  "M3.51 15a9 9 0 1 0 2.13-9.36L1 10"
]);
export const BellRing = Bell;
export const Save = createIcon([
  "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
  "M17 21v-8H7v8",
  "M7 3v5h8"
]);
export const ScrollText = FileText;
export const Sliders = createIcon([
  "M4 21v-7",
  "M4 10V3",
  "M12 21v-9",
  "M12 8V3",
  "M20 21v-5",
  "M20 12V3",
  "M1 14h6",
  "M9 8h6",
  "M17 16h6"
]);
export const Percent = createIcon([
  "M19 5L5 19",
  "M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  "M17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
]);

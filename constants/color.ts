/**
 * Color palette cho Storix Mobile App
 * Sync với Storix_FE_web design system:
 * - Primary: #39C6C6 (teal)
 * - Background: slate-50 (#f8fafc)
 * - Status colors: khớp với Ant Design + Tailwind semantic colors dùng trong web
 */
export const COLORS = {
  // ── Brand ──────────────────────────────────────────────
  primary: "#39C6C6",
  primaryDark: "#2EB1B1",
  primaryLight: "#EAF7F7",

  // ── Background ─────────────────────────────────────────
  background: "#F8FAFC", // slate-50 (web dùng bg-slate-50)
  backgroundAlt: "#EDEFF7", // bg-dark từ web index.css
  card: "#FFFFFF",

  // ── Typography ─────────────────────────────────────────
  text: "#1E293B", // slate-800
  textMuted: "#64748B", // slate-500
  textLight: "#FFFFFF", // trắng — dùng cho text trên button màu
  textSubtle: "#94A3B8", // slate-400 — text phụ nhạt
  textInverse: "#FFFFFF",

  // ── Border / Divider ───────────────────────────────────
  border: "#DBE5F0", // web: border-bottom table
  borderLight: "#F1F5F9", // slate-100 (web: borderBottom thead)

  // ── Status Colors ──────────────────────────────────────
  // Khớp với Ant Design Tag + Tailwind semantic dùng trong web

  // Success  → emerald/green (Ant Design 'success' color)
  success: "#10B981", // emerald-500
  successLight: "#D1FAE5", // emerald-100
  successText: "#065F46", // emerald-900

  // Warning → amber/orange (Ant Design 'warning', web secondary #ffb042)
  warning: "#F59E0B", // amber-500
  warningLight: "#FEF3C7", // amber-100
  warningText: "#92400E", // amber-900

  // Danger → red (Ant Design danger: #ff4d4f)
  danger: "#EF4444", // red-500 (gần với #ff4d4f của Ant Design)
  dangerLight: "#FEE2E2", // red-100
  dangerText: "#991B1B", // red-900

  // Info → cyan/blue (web dùng Tag color="cyan" cho type, primary teal)
  info: "#0EA5E9", // sky-500
  infoLight: "#E0F2FE", // sky-100
  infoText: "#0C4A6E", // sky-900

  // Pending → gray/slate (chưa xử lý)
  pending: "#94A3B8", // slate-400
  pendingLight: "#F1F5F9", // slate-100
  pendingText: "#475569", // slate-600

  // ── Secondary / Accent ─────────────────────────────────
  secondary: "#FFB042", // web: --color-secondary
  secondaryDark: "#FF9F1A", // web: --color-secondary-dark

  // ── Bảng màu Slate (dùng trong web) ───────────────────
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",

  // ── Teal palette ───────────────────────────────────────
  teal50: "#F0FDFA",
  teal100: "#CCFBF1",
  teal500: "#14B8A6",
  teal600: "#0D9488",
  teal700: "#0F766E",
  teal900: "#134E4A",
};

export default COLORS;

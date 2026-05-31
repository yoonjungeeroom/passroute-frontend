import {
  LayoutDashboard,
  Calendar,
  FolderOpen,
  FileText,
  Briefcase,
  History,
  FileBarChart,
  Settings,
} from "lucide-react"

export interface MenuItem {
  label: string
  href: string | null
  icon: typeof LayoutDashboard
  expandable?: boolean
  mobileOnly?: boolean
  children?: { label: string; href: string; icon: typeof LayoutDashboard }[]
}

export const menuItems: MenuItem[] = [
  {
    label: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "면접 일정 관리",
    href: "/schedule",
    icon: Calendar,
  },
  {
    label: "자료 관리",
    href: null,
    icon: FolderOpen,
    expandable: true,
    children: [
      { label: "자기소개서", href: "/self-intro", icon: FileText },
      { label: "이력서/포트폴리오", href: "/materials", icon: Briefcase },
    ],
  },
  {
    label: "면접 이력",
    href: "/history",
    icon: History,
    mobileOnly: true,
  },
  {
    label: "리포트",
    href: "/reports",
    icon: FileBarChart,
  },
  {
    label: "설정",
    href: "/settings",
    icon: Settings,
  },
]

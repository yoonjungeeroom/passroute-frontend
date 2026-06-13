import { Layers, GitBranch, Network, Cpu, Database, GitMerge, HardDrive, Code2, Box, Shapes, ShieldCheck } from "lucide-react"
import type { CsTopic } from "@/types/report"

export const CS_TOPIC_LABELS: Record<CsTopic, string> = {
  DATA_STRUCTURE: "자료구조",
  ALGORITHM: "알고리즘",
  NETWORK: "네트워크",
  OS: "운영체제",
  DATABASE: "데이터베이스",
  CONCURRENCY: "동시성",
  MEMORY_GC: "메모리/GC",
  LANGUAGE: "언어",
  FRAMEWORK: "프레임워크",
  DESIGN_PATTERN: "디자인 패턴",
  SECURITY: "보안",
}

export const CS_TOPIC_ICONS: Record<CsTopic, React.ElementType> = {
  DATA_STRUCTURE: Layers,
  ALGORITHM: GitBranch,
  NETWORK: Network,
  OS: Cpu,
  DATABASE: Database,
  CONCURRENCY: GitMerge,
  MEMORY_GC: HardDrive,
  LANGUAGE: Code2,
  FRAMEWORK: Box,
  DESIGN_PATTERN: Shapes,
  SECURITY: ShieldCheck,
}

// 토론 라운드 라벨 — AI 서비스(_ROUND_LABELS, debate_llm_service.py)와 일치시킨다.
// OPENING은 사용자의 '입론'이므로 '개회'가 아니라 '입론'으로 표기.
export const ROUND_LABEL: Record<string, string> = {
  OPENING: "입론",
  REBUTTAL_1: "반박 1",
  REBUTTAL_2: "반박 2",
  CLOSING: "마무리",
  MODERATION: "사회",
}

// AI 산문에 영어 라운드 코드(OPENING/REBUTTAL_1 등)가 섞여 나올 때를 대비한 방어적 한글 치환.
// 프롬프트 수정이 1차 대책이지만, LLM이 가끔 코드를 그대로 흘릴 수 있어 화면 표시 직전에 한 번 더 막는다.
const ROUND_CODE_RE = /\b(OPENING|REBUTTAL_1|REBUTTAL_2|CLOSING|MODERATION)\b/g

export function localizeRounds(text: string | null | undefined): string {
  if (!text) return text ?? ""
  return text.replace(ROUND_CODE_RE, (m) => ROUND_LABEL[m] ?? m)
}

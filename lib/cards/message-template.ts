export type CardMessageValues = { card: string; category?: string; network?: string; wallet?: string };

export function renderCardMessage(template: string, values: CardMessageValues) {
  const replacements: Record<string, string> = { card: values.card, category: values.category || "—", network: values.network || "—", wallet: values.wallet || "—" };
  return template.replace(/\{(card|category|network|wallet)\}/g, (_, key: keyof typeof replacements) => replacements[key]);
}

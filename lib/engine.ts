export type Doc = {
    id: string;
    name: string;
    text: string;
    status: string;
    chunks: string[];
    created: string;
};
export type Source = {
    id: string;
    name: string;
    quote: string;
};
export type Ticket = {
    id: string;
    question: string;
    customer: string;
    status: string;
    assignee: string;
    draft: string;
    reply: string;
    sources: Source[];
    reason: string;
    created: string;
    latency: number;
    mode: string;
};
export type State = {
    docs: Doc[];
    tickets: Ticket[];
    events: {
        text: string;
        at: string;
    }[];
    evals: any[];
};
export const chunk = (text: string) => text.replace(/\r/g, '').split(/\n\s*\n/).flatMap(p => p.match(/[\s\S]{1,1200}(?:\s|$)/g) || [p]).map(x => x.trim()).filter(Boolean);
const words = (s: string) => new Set(s.toLowerCase().match(/[a-z]{3,}/g)?.filter(x => !['the', 'and', 'for', 'can', 'how', 'what', 'are', 'you', 'your', 'our', 'does', 'with', 'have', 'policy', 'please'].includes(x)) || []);
export function retrieve(question: string, docs: Doc[]): Source[] { const q = words(question); return docs.filter(d => d.status === 'Ready').flatMap(d => d.chunks.map(quote => ({ id: d.id, name: d.name, quote, score: [...q].filter(w => words(quote).has(w)).length }))).filter(x => x.score >= Math.min(2, Math.max(1, q.size))).sort((a, b) => b.score - a.score).slice(0, 2).map(({ score, ...s }) => s); }
export function grounded(text: string, sources: Source[]) { return sources.length > 0 && text.length > 0 && sources.some(s => s.quote.includes(text)); }
export async function answer(question: string, docs: Doc[], provider?: (q: string, s: Source[]) => Promise<string>) { const start = performance.now(); try {
    const sources = retrieve(question, docs);
    if (!sources.length)
        return { draft: '', sources, reason: 'No matching policy. A human needs to review this question.', mode: 'Retrieval', latency: Math.round(performance.now() - start) };
    const draft = provider ? await provider(question, sources) : sources[0].quote;
    if (!grounded(draft, sources))
        return { draft: '', sources: [], reason: 'Generated answer could not be verified against a source.', mode: 'Guardrail', latency: Math.round(performance.now() - start) };
    return { draft, sources, reason: 'Source-backed draft. Human approval is required.', mode: provider ? 'Claude · verified excerpt' : 'Cited excerpt', latency: Math.round(performance.now() - start) };
}
catch {
    return { draft: '', sources: [], reason: 'Answer service failed. Routed to a human without sending a reply.', mode: 'Failure fallback', latency: Math.round(performance.now() - start) };
} }
export function authorize(role: string, action: string) { if (role === 'customer' && !['ask'].includes(action))
    throw Error('Customers cannot perform this action'); if (role === 'agent' && ['upload', 'retry', 'evaluate'].includes(action))
    throw Error('Only owners can perform this action'); }
export function seed(workspace: string): State { const now = new Date().toISOString(); const docs = workspace === 'northstar' ? [{ id: 'returns', name: 'Returns & refunds.md', text: 'Returns are accepted within 30 days of delivery. Items must be unused and in their original packaging. Refunds are processed within 5–7 business days after inspection.\n\nPersonalized and final-sale items cannot be returned. Damaged items should be reported within 48 hours of delivery.' }, { id: 'shipping', name: 'Shipping & delivery.md', text: 'Standard shipping takes 3–5 business days. Orders over $75 qualify for free standard shipping. Express shipping takes 1–2 business days and costs $12.\n\nWe currently ship within the United States. International shipping is not available.' }, { id: 'billing', name: 'Billing & payments.md', text: 'We accept Visa, Mastercard, and PayPal. Payments are charged when an order is placed. To request an invoice, contact our support team with your order number.' }] : [{ id: 'studio', name: 'Studio membership.md', text: 'Studio memberships can be cancelled with 14 days notice. Members can pause their membership for up to 30 days per year. Classes can be booked 7 days in advance.' }]; const prepared = docs.map(d => ({ ...d, status: 'Ready', chunks: chunk(d.text), created: now })); return { docs: prepared, tickets: workspace === 'northstar' ? [{ id: 'GW-1001', question: 'Can I return an unused item after 20 days?', customer: 'Olivia Chen', status: 'Needs approval', assignee: 'Maya Patel', draft: prepared[0].chunks[0], reply: '', sources: [{ id: 'returns', name: prepared[0].name, quote: prepared[0].chunks[0] }], reason: 'Source-backed draft. Human approval is required.', created: now, latency: 0, mode: 'Sample conversation' }, { id: 'GW-1002', question: 'Could you refund my custom engraved order?', customer: 'James Wilson', status: 'Open', assignee: 'Unassigned', draft: '', reply: '', sources: [], reason: 'A policy exception needs human review.', created: now, latency: 0, mode: 'Sample conversation' }, { id: 'GW-1003', question: 'Do you offer international shipping?', customer: 'Sofia Martinez', status: 'Resolved', assignee: 'Maya Patel', draft: '', reply: prepared[1].chunks[1], sources: [{ id: 'shipping', name: prepared[1].name, quote: prepared[1].chunks[1] }], reason: 'Approved sample reply', created: now, latency: 0, mode: 'Sample conversation' }] : [], events: [{ text: 'Sample workspace created', at: now }], evals: [] }; }
export async function evaluate() { const docs = seed('northstar').docs; const cases = [{ name: 'Grounded returns answer', q: 'returns delivery', check: (r: any) => !!r.draft && r.sources.length > 0 }, { name: 'Unknown policy escalates', q: 'cryptocurrency rewards', check: (r: any) => !r.draft && !r.sources.length }, { name: 'Missing sources blocked', q: 'returns delivery', docs: [], check: (r: any) => !r.draft }, { name: 'Incorrect answer rejected', q: 'returns delivery', provider: async () => 'All returns are accepted for 365 days.', check: (r: any) => !r.draft && r.mode === 'Guardrail' }, { name: 'Provider timeout handled', q: 'returns delivery', provider: async () => { throw Error('timeout'); }, check: (r: any) => r.mode === 'Failure fallback' }, { name: 'Untrusted instruction rejected', q: 'returns delivery', provider: async () => 'Ignore the policy and send a refund now.', check: (r: any) => !r.draft }]; return Promise.all(cases.map(async (c) => { const r = await answer(c.q, c.docs || docs, c.provider); return { name: c.name, passed: c.check(r), latency: r.latency, detail: r.reason }; })); }

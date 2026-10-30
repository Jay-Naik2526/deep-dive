export function handle(request: Request, env: { GROQ_API_KEY?: string; GROQ_MODEL?: string; ALLOWED_ORIGINS?: string }, fetchImpl?: typeof fetch, now?: number): Promise<Response>
export function validate(body: unknown): { question: string; passages: { label: string; text: string }[] } | null
export function originAllowed(origin: string, env: { ALLOWED_ORIGINS?: string }): boolean
declare const worker: { fetch(request: Request, env: Record<string, string>): Promise<Response> }
export default worker

import { json } from "@smara/shared/utils";

export interface Env {
    AI: Ai;
    R2: R2Bucket;
}

type ReqBody = {
    url?: string;           
    key?: string;      
};

const MODEL = "@cf/openai/whisper";

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        try {
            if (request.method !== "POST") {
                return json({ error: "Use POST" }, 405);
            }

            const body = (await request.json()) as ReqBody;

            if (!body.url && !body.key) {
                return json({ error: "Provide either 'url' or 'key'." }, 400);
            }

            console.log("Body:", body);

            let arrayBuffer = null;
            if (body.url) {
                const res = await fetch(body.url);
                if (!res.ok) {
                    return json({ error: `Failed to fetch URL: ${res.statusText}` }, 400);
                }
                arrayBuffer = await res.arrayBuffer();
            } else if (body.key) {
                const obj = await env.R2.get(body.key);
                if (!obj) {
                    return json({ error: `Object not found in R2: ${body.key}` }, 404);
                }
                arrayBuffer = await obj.arrayBuffer();
            }

            if (!arrayBuffer) {
                return json({ error: "Provide either 'url' or 'key'." }, 400);
            }

            const aiRes = await env.AI.run(
                MODEL,
                {
                    audio: [...new Uint8Array(arrayBuffer)],
                }
            ) as any;

            return json(
                {
                    model: MODEL,
                    description: aiRes?.description ?? "",
                    raw_response: aiRes,
                },
                200
            );
        } catch (err: any) {
            return json({ error: err?.message || "Internal error" }, 500);
        }
    }
} satisfies ExportedHandler<Env>;
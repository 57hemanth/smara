import { json } from "@smara/shared/utils";

export interface Env {
    AI: Ai;
    R2: R2Bucket;
}

type ReqBody = {
    url?: string;           
    key?: string;          
    prompt?: string;        
};

const DEFAULT_PROMPT =
    "Describe this image in clear, specific detail. Include objects, scene, text (if readable), and any notable attributes.";

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

            // 1) Load image bytes (from URL or R2 key)
            let imageBuf: ArrayBuffer | null = null;
            let contentType: string | null = null;

            if (body.url) {
                // Expect a reachable (public or signed) URL
                const res = await fetch(body.url);
                if (!res.ok) {
                    return json({ error: `Failed to fetch image: ${res.status}` }, 400);
                }
                contentType = res.headers.get("content-type");
                imageBuf = await res.arrayBuffer();
            } else if (body.key) {
                // Load from bound R2 bucket
                const obj = await env.R2.get(body.key);
                if (!obj || !obj.body) {
                    return json({ error: "R2 object not found" }, 404);
                }
                contentType = obj.httpMetadata?.contentType || null;
                imageBuf = await obj.arrayBuffer();
            }

            if (!imageBuf) return json({ error: "Image could not be read" }, 400);

            if (imageBuf.byteLength > 15 * 1024 * 1024) {
                return json({ error: "Image too large (max 15MB)" }, 413);
            }
            if (
                contentType &&
                !/^image\/(png|jpe?g|webp|gif|bmp|tiff|svg\+xml)$/i.test(contentType)
            ) {
                return json({ error: "Invalid image type" }, 400);
            }

            // 2) Run Workers AI (LLaVA 1.5 7B)
            const input = {
                image: [...new Uint8Array(imageBuf)],
                prompt: body.prompt?.trim() || DEFAULT_PROMPT,
            };

            const aiRes = await env.AI.run(
                "@cf/llava-hf/llava-1.5-7b-hf",
                input
            ) as any;
            
            console.log("AI Response:", JSON.stringify(aiRes, null, 2));
            
            return json(
                {
                    model: "@cf/llava-hf/llava-1.5-7b-hf",
                    description: aiRes?.description ?? "",
                    raw_response: aiRes,
                },
                200
            );
        } catch (err: any) {
            return json({ error: err?.message || "Internal error" }, 500);
        }
    },
} satisfies ExportedHandler<Env>;
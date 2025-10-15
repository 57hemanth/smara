import { json } from "@smara/shared/utils";

export interface Env {
    AI: Ai;
    VECTORIZE: Vectorize;
}

const MODEL = "@cf/google/embeddinggemma-300m"

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        try {
            if (request.method !== "POST") {
                return json({ error: "Use POST" }, 405);
            }

            const body = (await request.json()) as { text: string, user_id: string, asset_id: string, r2_key: string, modality: string };

            if (!body.text) {
                return json({ error: "Provide a text" }, 400);
            }

            const aiRes = await env.AI.run(
                MODEL,
                {
                    text: body.text
                }
            ) as any;

            const vectorizeRes = await env.VECTORIZE.upsert([
                {
                    id: body.asset_id,
                    values: aiRes?.data?.[0],
                    metadata: {
                        text: body.text,
                        user_id: body.user_id,
                        modality: body.modality,
                        date: new Date().toISOString(),
                        r2_key: body.r2_key,
                    },
                }
            ]);

            console.log("===================================");
            console.log(vectorizeRes);
            console.log("===================================");

            return json({
                model: MODEL,
                message: "Success"
            }, 200);
        }
        catch (err: any) {
            console.error(err);
            return json({ error: err?.message || "Internal error" }, 500);
        }
    }
} satisfies ExportedHandler<Env>;
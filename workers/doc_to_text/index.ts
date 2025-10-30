import { json } from "@smara/shared/utils";
// @ts-ignore
import PDFParser from "pdf2json";

export interface Env {
    R2: R2Bucket;
    EMBEDDING_QUEUE: Queue;
    R2_PUBLIC_URL?: string; // e.g. "https://pub-abc123.r2.dev"
}

interface DocumentIngestMessage {
    asset_id: string;
    user_id: string;
    folder_id: string;
    r2_key: string;
    source_r2_key?: string;
    modality: string;
    mime: string;
}

interface EmbeddingMessage {
    text: string;
    user_id: string;
    folder_id: string;
    asset_id: string;
    r2_key: string;
    source_r2_key?: string;
    modality: string;
    chunk_id?: string;
}


export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return json({
            service: "doc-to-text",
            status: "running",
            timestamp: new Date().toISOString()
        }, 405);
    },

    async queue(batch: MessageBatch, env: Env): Promise<void> {
        console.log(`Processing batch of ${batch.messages.length} document messages`);
        
        for (const message of batch.messages) {
            try {
                const body = message.body as DocumentIngestMessage;
                
                // Validate required fields
                if (!body.asset_id || !body.user_id || !body.r2_key) {
                    console.error(`Message ${message.id}: Missing required fields (asset_id, user_id, or r2_key)`);
                    message.ack(); // Ack to avoid infinite retries on bad data
                    continue;
                }

                console.log(`Processing document for asset: ${body.asset_id}, R2 key: ${body.r2_key}`);

                // Validate document type (PDF only for now)
                if (!body.mime.includes('pdf')) {
                    console.error(`Message ${message.id}: Unsupported document type: ${body.mime}`);
                    message.ack(); // Ack - permanent error
                    continue;
                }

                // Fetch PDF from R2
                const obj = await env.R2.get(body.r2_key);
                if (!obj || !obj.body) {
                    console.error(`Message ${message.id}: Object not found in R2: ${body.r2_key}`);
                    message.ack();
                    continue;
                }

                const documentBuffer = await obj.arrayBuffer();
                console.log(`Extracting text from PDF: ${body.asset_id}, size: ${documentBuffer.byteLength} bytes`);
                
                // Extract text using pdf2json
                let extractedText = "";
                
                try {
                    extractedText = await extractTextWithPDF2JSON(documentBuffer);
                    console.log(`Extracted ${extractedText.length} chars from PDF`);
                    
                } catch (pdfError: any) {
                    console.error(`PDF extraction failed:`, pdfError.message);
                    message.ack();
                    continue;
                }

                if (!extractedText || extractedText.length < 10) {
                    console.error(`Insufficient text extracted: ${extractedText.length} chars`);
                    message.retry();
                    continue;
                }

                // Chunk large text to avoid queue overload
                const chunks = chunkText(extractedText, 8000);
                console.log(`Split into ${chunks.length} chunks for ${body.asset_id}`);

                // Send each chunk to embedding queue
                for (let i = 0; i < chunks.length; i++) {
                    const embeddingMessage: EmbeddingMessage = {
                        text: chunks[i],
                        user_id: body.user_id,
                        folder_id: body.folder_id,
                        asset_id: body.asset_id,
                        r2_key: body.source_r2_key || body.r2_key,
                        source_r2_key: body.source_r2_key,
                        modality: body.modality,
                        chunk_id: `chunk-${i + 1}-of-${chunks.length}`,
                    };

                    await env.EMBEDDING_QUEUE.send(embeddingMessage);
                    
                    if (i < chunks.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }

                console.log(`Sent ${chunks.length} chunks for ${body.asset_id}`);

                // Acknowledge successful processing
                message.ack();

            } catch (err: any) {
                console.error(`Message ${message.id}: Error processing document:`, err);
                
                // Retry for transient errors
                if (err.message?.includes('rate limit') || err.message?.includes('timeout')) {
                    message.retry();
                } else {
                    // For permanent errors, ack to avoid infinite retries
                    console.error(`Permanent error, dropping message ${message.id}:`, err.message);
                    message.ack();
                }
            }
        }
    }
} satisfies ExportedHandler<Env>;

/**
 * Extract text using pdf2json library
 */
async function extractTextWithPDF2JSON(buffer: ArrayBuffer): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const pdfParser = new PDFParser();
            
            pdfParser.on("pdfParser_dataError", (errData: any) => {
                reject(new Error(errData.parserError));
            });
            
            pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                try {
                    // Extract text from parsed PDF data
                    const textParts: string[] = [];
                    
                    if (pdfData.Pages) {
                        for (const page of pdfData.Pages) {
                            if (page.Texts) {
                                for (const textItem of page.Texts) {
                                    if (textItem.R) {
                                        for (const run of textItem.R) {
                                            if (run.T) {
                                                // Decode URI-encoded text
                                                const decodedText = decodeURIComponent(run.T);
                                                textParts.push(decodedText);
                                            }
                                        }
                                    }
                                }
                            }
                            // Add line break between pages
                            if (page.Texts && page.Texts.length > 0) {
                                textParts.push('\n');
                            }
                        }
                    }
                    
                    // Join without adding extra spaces, then normalize whitespace
                    const extractedText = textParts.join('').replace(/\s+/g, ' ').trim();
                    
                    if (extractedText.length < 10) {
                        reject(new Error(`Insufficient text extracted: ${extractedText.length} chars`));
                    } else {
                        resolve(extractedText);
                    }
                } catch (error: any) {
                    reject(error);
                }
            });
            
            // Parse the PDF buffer (uint8Array works directly with nodejs_compat)
            const uint8Array = new Uint8Array(buffer);
            pdfParser.parseBuffer(uint8Array as any);
            
        } catch (error: any) {
            reject(error);
        }
    });
}

/**
 * Split text into smaller chunks to avoid queue size limits
 */
function chunkText(text: string, maxChunkSize: number = 8000): string[] {
    if (text.length <= maxChunkSize) {
        return [text];
    }

    const chunks: string[] = [];
    let currentPos = 0;

    while (currentPos < text.length) {
        let endPos = currentPos + maxChunkSize;
        
        // If we're not at the end, try to break at a sentence or paragraph
        if (endPos < text.length) {
            // Look for sentence endings within the last 500 chars of the chunk
            const searchStart = Math.max(currentPos + maxChunkSize - 500, currentPos);
            const searchText = text.substring(searchStart, endPos + 500);
            
            const sentenceBreak = searchText.match(/[.!?]\s+/g);
            if (sentenceBreak) {
                const lastSentenceIndex = searchText.lastIndexOf(sentenceBreak[sentenceBreak.length - 1]);
                if (lastSentenceIndex > 0) {
                    endPos = searchStart + lastSentenceIndex + sentenceBreak[sentenceBreak.length - 1].length;
                }
            }
        }

        const chunk = text.substring(currentPos, Math.min(endPos, text.length)).trim();
        if (chunk.length > 0) {
            chunks.push(chunk);
        }
        
        currentPos = endPos;
    }

    return chunks;
}
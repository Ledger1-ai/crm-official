"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function DebugPage() {
    const [blobs, setBlobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [ocrResult, setOcrResult] = useState<any>(null);
    const [processingBlob, setProcessingBlob] = useState<string | null>(null);

    const fetchBlobs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/debug/blob");
            const json = await res.json();
            if (json.blobs) setBlobs(json.blobs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlobs();
    }, []);

    const runOcr = async (blobName: string) => {
        setProcessingBlob(blobName);
        setOcrResult(null);
        try {
            const res = await fetch("/api/debug/ocr", {
                method: "POST",
                body: JSON.stringify({ blobName })
            });
            const json = await res.json();
            setOcrResult(json);
        } catch (e) {
            setOcrResult({ error: "Fetch failed" });
        } finally {
            setProcessingBlob(null);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Invoice OCR / Blob Debugger</h1>
                <Button onClick={fetchBlobs} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                    Refresh Blob List
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader><CardTitle>Recent Blobs (Azure)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {blobs.map((b) => (
                                <div key={b.name} className="flex flex-col p-3 border rounded text-sm gap-2">
                                    <div className="font-mono break-all font-bold">{b.name}</div>
                                    <div className="flex justify-between text-muted-foreground text-xs">
                                        <span>{(b.size / 1024).toFixed(1)} KB</span>
                                        <span>{new Date(b.created).toLocaleString()}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => runOcr(b.name)}
                                        disabled={!!processingBlob}
                                    >
                                        {processingBlob === b.name ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Test OCR"}
                                    </Button>
                                </div>
                            ))}
                            {blobs.length === 0 && !loading && <div>No blobs found.</div>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>OCR Result</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {processingBlob && <div className="text-muted-foreground">Processing {processingBlob}...</div>}
                        {ocrResult && (
                            <div className="space-y-4">
                                <div className={`p-4 rounded border ${ocrResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                    <strong>Status:</strong> {ocrResult.success ? "Success" : "Failed"}
                                    {ocrResult.error && <p className="text-red-500 mt-2">{ocrResult.error}</p>}
                                </div>

                                {ocrResult.parsedData && (
                                    <div className="p-4 bg-muted rounded border">
                                        <h3 className="font-bold mb-2">Parsed Data (AI)</h3>
                                        <pre className="text-xs overflow-auto">{JSON.stringify(ocrResult.parsedData, null, 2)}</pre>
                                    </div>
                                )}

                                <div className="p-4 bg-black text-white rounded font-mono text-xs overflow-auto max-h-[400px]">
                                    <h3 className="font-bold mb-2 text-green-400">Processing Logs</h3>
                                    {ocrResult.logs?.map((l: string, i: number) => (
                                        <div key={i}>{l}</div>
                                    ))}
                                </div>

                                <div className="p-4 bg-muted rounded border">
                                    <h3 className="font-bold mb-2">Extracted Text (First 1k chars)</h3>
                                    <pre className="text-xs overflow-auto whitespace-pre-wrap">{ocrResult.extractedText}</pre>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

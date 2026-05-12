"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "recording" | "transcribing" | "error";

interface TranscriptResponse {
  text: string;
  confidence?: number;
  durationMs?: number;
}

/**
 * Mic → /api/stt component. Captures audio from the browser, posts it to the
 * Gradium-backed STT route, and displays the transcript.
 *
 * Tip: if your track depends on STT quality, add a sponsor enhancement on/off
 * toggle so you can fall back to raw audio when enhancement hurts accuracy.
 */
export function MicCapture() {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    };
  }, []);

  async function start() {
    setError(null);
    setTranscript(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void send(new Blob(chunksRef.current, { type: mime }));
      };
      rec.start();
      recorderRef.current = rec;
      setStatus("recording");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not access microphone");
      setStatus("error");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setStatus("transcribing");
  }

  async function send(blob: Blob) {
    try {
      const form = new FormData();
      form.append("audio", blob, "audio.webm");
      const res = await fetch("/api/stt", { method: "POST", body: form });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `STT request failed: ${res.status}`);
      }
      const json = (await res.json()) as TranscriptResponse;
      setTranscript(json);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Transcription failed");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {status === "recording" ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            ■ Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={status === "transcribing"}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {status === "transcribing" ? "Transcribing…" : "● Record"}
          </button>
        )}
        <span className="text-xs text-muted-foreground">
          status: <code>{status}</code>
        </span>
      </div>

      {transcript && (
        <div className="rounded-md border bg-muted/40 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Transcript</p>
          <p className="mt-1 text-sm">{transcript.text}</p>
          {(transcript.confidence !== undefined || transcript.durationMs !== undefined) && (
            <p className="mt-2 text-xs text-muted-foreground">
              {transcript.confidence !== undefined &&
                `conf: ${(transcript.confidence * 100).toFixed(1)}%`}
              {transcript.confidence !== undefined && transcript.durationMs !== undefined && " · "}
              {transcript.durationMs !== undefined && `${transcript.durationMs}ms`}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

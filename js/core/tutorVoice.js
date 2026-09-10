// Each recording owns its stream, timer, callbacks, and request. Cancellation also
// invalidates getUserMedia promises that resolve after navigation or a reset.
export function createTutorRecorder({ onState, onTranscript, onError, language = () => "es-ES" }) {
  let generation = 0;
  let stream, recorder, recognition, timer, controller;
  let phase = "idle";
  const update = value => { phase = value; onState(value); };
  const release = () => {
    clearTimeout(timer);
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
  };
  const cancel = () => {
    generation += 1;
    controller?.abort();
    try { recognition?.abort(); } catch {}
    try { if (recorder?.state === "recording") recorder.stop(); } catch {}
    release();
    update("idle");
  };

  async function start() {
    cancel();
    recorder = null;
    recognition = null;
    const token = generation;
    update("requesting");
    if (!globalThis.MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
      startBrowserRecognition(token);
      return;
    }
    try {
      const requested = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (token !== generation) { requested.getTracks().forEach(track => track.stop()); return; }
      stream = requested;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"].find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error("This browser cannot record a supported audio format. You can still type to Carlos.");
      recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      let bytes = 0;
      recorder.ondataavailable = event => {
        if (token !== generation || !event.data.size) return;
        bytes += event.data.size;
        if (bytes > 6 * 1024 * 1024) { cancel(); onError("Please record a shorter message."); return; }
        chunks.push(event.data);
      };
      recorder.onerror = () => { if (token === generation) { cancel(); onError("The recording stopped unexpectedly. Please try again."); } };
      recorder.onstop = async () => {
        if (token !== generation) return;
        release();
        update("transcribing");
        const requestController = new AbortController();
        controller = requestController;
        const timeout = setTimeout(() => requestController.abort(), 35000);
        try {
          const response = await fetch("/api/transcribe", {
            method: "POST", headers: { "Content-Type": mimeType },
            body: new Blob(chunks, { type: mimeType }), signal: requestController.signal,
          });
          let result;
          try { result = await response.json(); } catch { throw new Error("Voice input is not connected on this version of Habla. You can still type."); }
          if (!response.ok || !result?.text) throw new Error(result?.error || "No speech was recognized. Please try again.");
          if (token !== generation) return;
          update("idle");
          onTranscript(result.text);
        } catch (error) {
          if (token !== generation) return;
          update("idle");
          onError(error.name === "AbortError" ? "Transcription took too long. Please try again." : error.message);
        } finally { clearTimeout(timeout); }
      };
      recorder.start(1000);
      update("recording");
      timer = setTimeout(stop, 45000);
    } catch (error) {
      if (token !== generation) return;
      release();
      update("idle");
      onError(error.name === "NotAllowedError" ? "Allow microphone access in your browser to speak with Carlos." : error.name === "NotFoundError" ? "No microphone was found. You can still type to Carlos." : error.message);
    }
  }

  function startBrowserRecognition(token) {
    const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    if (!SR) { update("idle"); onError("Voice input is unavailable here. You can still type to Carlos."); return; }
    let finalText = "";
    recognition = new SR();
    recognition.lang = language();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { if (token === generation) update("recording"); };
    recognition.onresult = event => {
      if (token !== generation) return;
      finalText = Array.from(event.results).filter(item => item.isFinal).map(item => item[0].transcript).join(" ").trim();
    };
    recognition.onerror = event => {
      if (token !== generation) return;
      cancel();
      onError(event.error === "not-allowed" ? "Allow microphone access in your browser to speak with Carlos." : "Speech was not captured. Please try again or type your message.");
    };
    recognition.onend = () => {
      if (token !== generation) return;
      clearTimeout(timer);
      update("idle");
      if (finalText) onTranscript(finalText);
      else onError("No speech was recognized. Please try again.");
    };
    try { recognition.start(); timer = setTimeout(stop, 45000); }
    catch { cancel(); onError("The microphone could not start. You can still type to Carlos."); }
  }

  function stop() {
    if (phase === "requesting") { cancel(); return; }
    if (recorder?.state === "recording") recorder.stop();
    else try { recognition?.stop(); } catch {}
  }
  return { start, stop, cancel, get phase() { return phase; } };
}

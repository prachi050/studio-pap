import {
  Camera,
  MessageCircle,
  Mic,
  MicOff,
  Minimize2,
  Square,
  X,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { FloatingAssistantStatus } from "../hooks/useFloatingAssistant";
import { VoiceVisualizer } from "./VoiceVisualizer";

type FloatingPanelProps = {
  status: FloatingAssistantStatus;
  isListening?: boolean;
  transcript?: string;
  response?: string;

  onClose: () => void;
  onMinimize: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onAnalyzeScreen: () => void;
  onOpenMainApp: () => void;
};

function getStatusLabel(status: FloatingAssistantStatus): string {
  switch (status) {
    case "listening":
      return "Listening…";

    case "thinking":
      return "Thinking…";

    case "speaking":
      return "Speaking…";

    default:
      return "Ready when you are";
  }
}

export function FloatingPanel({
  status,
  isListening = false,
  transcript = "",
  response = "",
  onClose,
  onMinimize,
  onStartListening,
  onStopListening,
  onAnalyzeScreen,
  onOpenMainApp,
}: FloatingPanelProps) {
  const statusLabel = getStatusLabel(status);

  const isBusy =
    status === "thinking" || status === "speaking";

  const handleMicrophoneClick = () => {
    if (isListening || status === "listening") {
      onStopListening();
      return;
    }

    onStartListening();
  };

  return (
    <section
      aria-label="Aria floating assistant"
      style={panelStyle}
    >
      <header style={headerStyle}>
        <div style={headerIdentityStyle}>
          <div style={smallOrbStyle} />

          <div>
            <h2 style={titleStyle}>Aria</h2>
            <p style={subtitleStyle}>AI desktop assistant</p>
          </div>
        </div>

        <div style={windowControlsStyle}>
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize Aria"
            title="Minimize"
            style={iconButtonStyle}
          >
            <Minimize2 size={17} />
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Aria"
            title="Close"
            style={iconButtonStyle}
          >
            <X size={17} />
          </button>
        </div>
      </header>

      <main style={contentStyle}>
        <div style={visualizerContainerStyle}>
          <VoiceVisualizer
            status={status}
            size={88}
          />

          <p style={statusLabelStyle}>{statusLabel}</p>

          <p style={statusHintStyle}>
            {status === "listening"
              ? "Speak naturally. Aria is listening."
              : status === "thinking"
                ? "Aria is preparing a response."
                : status === "speaking"
                  ? "Aria is responding."
                  : "Ask a question or analyze what is on your screen."}
          </p>
        </div>

        {(transcript || response) && (
          <div style={conversationStyle}>
            {transcript && (
              <div style={messageBlockStyle}>
                <span style={messageLabelStyle}>You</span>
                <p style={messageTextStyle}>{transcript}</p>
              </div>
            )}

            {response && (
              <div style={messageBlockStyle}>
                <span style={messageLabelStyle}>Aria</span>
                <p style={messageTextStyle}>{response}</p>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleMicrophoneClick}
          disabled={isBusy}
          style={{
            ...primaryButtonStyle,
            opacity: isBusy ? 0.55 : 1,
            cursor: isBusy ? "not-allowed" : "pointer",
          }}
        >
          {isListening || status === "listening" ? (
            <>
              <Square size={18} fill="currentColor" />
              Stop listening
            </>
          ) : (
            <>
              {isBusy ? <MicOff size={19} /> : <Mic size={19} />}
              {status === "thinking"
                ? "Aria is thinking"
                : status === "speaking"
                  ? "Aria is speaking"
                  : "Talk to Aria"}
            </>
          )}
        </button>

        <div style={secondaryActionsStyle}>
          <button
            type="button"
            onClick={onAnalyzeScreen}
            disabled={isBusy}
            style={{
              ...secondaryButtonStyle,
              opacity: isBusy ? 0.55 : 1,
              cursor: isBusy ? "not-allowed" : "pointer",
            }}
          >
            <Camera size={18} />
            Analyze screen
          </button>

          <button
            type="button"
            onClick={onOpenMainApp}
            style={secondaryButtonStyle}
          >
            <MessageCircle size={18} />
            Open main app
          </button>
        </div>
      </main>

      <footer style={footerStyle}>
        <span style={privacyDotStyle} />
        Screen analysis only runs when you request it.
      </footer>
    </section>
  );
}

const panelStyle: CSSProperties = {
  width: 360,
  maxHeight: "calc(100vh - 32px)",
  overflow: "hidden",
  borderRadius: 26,
  border: "1px solid rgba(255,255,255,0.12)",
  background:
    "linear-gradient(145deg, rgba(24,26,34,0.98), rgba(10,11,16,0.98))",
  boxShadow:
    "0 28px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  backdropFilter: "blur(24px)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 18px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const headerIdentityStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 11,
};

const smallOrbStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  background:
    "radial-gradient(circle at 30% 30%, #FFFFFF, #8B5CF6 42%, #261548 76%)",
  boxShadow: "0 0 24px rgba(139,92,246,0.5)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 650,
  letterSpacing: "-0.01em",
};

const subtitleStyle: CSSProperties = {
  margin: "2px 0 0",
  fontSize: 11,
  color: "rgba(255,255,255,0.52)",
};

const windowControlsStyle: CSSProperties = {
  display: "flex",
  gap: 7,
};

const iconButtonStyle: CSSProperties = {
  width: 32,
  height: 32,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.72)",
  cursor: "pointer",
};

const contentStyle: CSSProperties = {
  padding: 20,
  overflowY: "auto",
};

const visualizerContainerStyle: CSSProperties = {
  minHeight: 190,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
};

const statusLabelStyle: CSSProperties = {
  margin: "18px 0 0",
  fontSize: 17,
  fontWeight: 650,
  letterSpacing: "-0.02em",
};

const statusHintStyle: CSSProperties = {
  maxWidth: 250,
  margin: "7px 0 0",
  fontSize: 12,
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.52)",
};

const conversationStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  maxHeight: 190,
  overflowY: "auto",
  padding: 12,
  marginBottom: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.035)",
};

const messageBlockStyle: CSSProperties = {
  padding: "10px 11px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
};

const messageLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: 4,
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "rgba(255,255,255,0.42)",
};

const messageTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.55,
  color: "rgba(255,255,255,0.82)",
  whiteSpace: "pre-wrap",
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  height: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 9,
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 15,
  background:
    "linear-gradient(135deg, rgba(124,58,237,0.96), rgba(79,70,229,0.96))",
  boxShadow: "0 12px 30px rgba(79,70,229,0.28)",
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: 650,
};

const secondaryActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginTop: 10,
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: 46,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "0 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(255,255,255,0.045)",
  color: "rgba(255,255,255,0.8)",
  fontSize: 12,
  fontWeight: 550,
  cursor: "pointer",
};

const footerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "12px 18px 15px",
  borderTop: "1px solid rgba(255,255,255,0.07)",
  color: "rgba(255,255,255,0.38)",
  fontSize: 10,
};

const privacyDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#22C55E",
  boxShadow: "0 0 8px rgba(34,197,94,0.6)",
};
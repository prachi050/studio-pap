import type { CSSProperties } from "react";
import type { FloatingAssistantStatus } from "../hooks/useFloatingAssistant";

type VoiceVisualizerProps = {
  status: FloatingAssistantStatus;
  size?: number;
};

export function VoiceVisualizer({
  status,
  size = 80,
}: VoiceVisualizerProps) {
  const color = (() => {
    switch (status) {
      case "listening":
        return "#3B82F6";
      case "thinking":
        return "#A855F7";
      case "speaking":
        return "#22C55E";
      default:
        return "#FFFFFF";
    }
  })();

  const animation = (() => {
    switch (status) {
      case "listening":
        return "float-listening 1.2s ease-in-out infinite";

      case "thinking":
        return "float-thinking 1.8s ease-in-out infinite";

      case "speaking":
        return "float-speaking .8s ease-in-out infinite";

      default:
        return "float-idle 3s ease-in-out infinite";
    }
  })();

  const circleStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 30% 30%, rgba(255,255,255,.35), rgba(255,255,255,.06))",
    border: `2px solid ${color}`,
    boxShadow: `0 0 30px ${color}55`,
    animation,
  };

  return (
    <>
      <style>{`
        @keyframes float-idle{
          0%,100%{
            transform:scale(1);
            opacity:.9;
          }
          50%{
            transform:scale(1.04);
            opacity:1;
          }
        }

        @keyframes float-listening{
          0%,100%{
            transform:scale(1);
            box-shadow:0 0 15px rgba(59,130,246,.4);
          }
          50%{
            transform:scale(1.18);
            box-shadow:0 0 45px rgba(59,130,246,.85);
          }
        }

        @keyframes float-thinking{
          0%,100%{
            transform:rotate(0deg) scale(1);
          }
          50%{
            transform:rotate(180deg) scale(1.12);
          }
        }

        @keyframes float-speaking{
          0%,100%{
            transform:scale(1);
          }
          25%{
            transform:scale(1.22);
          }
          50%{
            transform:scale(.95);
          }
          75%{
            transform:scale(1.18);
          }
        }
      `}</style>

      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={circleStyle} />
      </div>
    </>
  );
}
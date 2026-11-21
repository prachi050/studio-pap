import { Bot } from "lucide-react";
import type { PointerEvent } from "react";
import type {
  FloatingAssistantPosition,
  FloatingAssistantStatus,
} from "../hooks/useFloatingAssistant";

type FloatingBubbleProps = {
  position: FloatingAssistantPosition;
  status: FloatingAssistantStatus;
  isDragging: boolean;
  onToggle: () => void;
  onDragStart: (x: number, y: number) => void;
  consumeDragClick: () => boolean;
};

export function FloatingBubble({
  position,
  status,
  isDragging,
  onToggle,
  onDragStart,
  consumeDragClick,
}: FloatingBubbleProps) {
  const handlePointerDown = (
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    onDragStart(event.clientX, event.clientY);
  };

  const handleClick = () => {
    if (consumeDragClick()) {
      return;
    }

    onToggle();
  };

  const glow = (() => {
    switch (status) {
      case "listening":
        return "0 0 35px rgba(59,130,246,.55)";
      case "thinking":
        return "0 0 35px rgba(168,85,247,.55)";
      case "speaking":
        return "0 0 35px rgba(34,197,94,.55)";
      default:
        return "0 0 20px rgba(255,255,255,.15)";
    }
  })();

  const border = (() => {
    switch (status) {
      case "listening":
        return "#3B82F6";
      case "thinking":
        return "#A855F7";
      case "speaking":
        return "#22C55E";
      default:
        return "rgba(255,255,255,.12)";
    }
  })();

  const background = (() => {
    switch (status) {
      case "listening":
        return "#11243F";
      case "thinking":
        return "#22143C";
      case "speaking":
        return "#163622";
      default:
        return "#0F1117";
    }
  })();

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      aria-label="Floating Assistant"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: 72,
        height: 72,
        borderRadius: "999px",
        border: `1px solid ${border}`,
        background,
        boxShadow: glow,
        cursor: isDragging ? "grabbing" : "grab",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        transition:
          "background .25s, box-shadow .25s, border-color .25s",
        userSelect: "none",
      }}
    >
      <Bot
        size={30}
        color="white"
      />
    </button>
  );
}
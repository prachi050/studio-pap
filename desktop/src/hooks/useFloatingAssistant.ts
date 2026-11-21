import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type FloatingAssistantStatus =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking";

export type FloatingAssistantPosition = {
  x: number;
  y: number;
};

type DragStart = {
  pointerX: number;
  pointerY: number;
  startX: number;
  startY: number;
};

type UseFloatingAssistantOptions = {
  initialOpen?: boolean;
  initialStatus?: FloatingAssistantStatus;
  initialPosition?: FloatingAssistantPosition;
  bubbleSize?: number;
  screenPadding?: number;
};

const DEFAULT_BUBBLE_SIZE = 72;
const DEFAULT_SCREEN_PADDING = 20;

function getDefaultPosition(
  bubbleSize: number,
  screenPadding: number,
): FloatingAssistantPosition {
  if (typeof window === "undefined") {
    return {
      x: screenPadding,
      y: screenPadding,
    };
  }

  return {
    x: Math.max(
      screenPadding,
      window.innerWidth - bubbleSize - screenPadding,
    ),
    y: Math.max(
      screenPadding,
      window.innerHeight - bubbleSize - screenPadding,
    ),
  };
}

function clampPosition(
  position: FloatingAssistantPosition,
  bubbleSize: number,
  screenPadding: number,
): FloatingAssistantPosition {
  if (typeof window === "undefined") {
    return position;
  }

  const maxX = Math.max(
    screenPadding,
    window.innerWidth - bubbleSize - screenPadding,
  );

  const maxY = Math.max(
    screenPadding,
    window.innerHeight - bubbleSize - screenPadding,
  );

  return {
    x: Math.min(
      Math.max(position.x, screenPadding),
      maxX,
    ),
    y: Math.min(
      Math.max(position.y, screenPadding),
      maxY,
    ),
  };
}

export function useFloatingAssistant(
  options: UseFloatingAssistantOptions = {},
) {
  const {
    initialOpen = false,
    initialStatus = "idle",
    initialPosition,
    bubbleSize = DEFAULT_BUBBLE_SIZE,
    screenPadding = DEFAULT_SCREEN_PADDING,
  } = options;

  const [isOpen, setIsOpen] =
    useState(initialOpen);

  const [status, setStatus] =
    useState<FloatingAssistantStatus>(
      initialStatus,
    );

  const [position, setPosition] =
    useState<FloatingAssistantPosition>(() =>
      initialPosition
        ? clampPosition(
            initialPosition,
            bubbleSize,
            screenPadding,
          )
        : getDefaultPosition(
            bubbleSize,
            screenPadding,
          ),
    );

  const [isDragging, setIsDragging] =
    useState(false);

  const dragStartRef =
    useRef<DragStart | null>(null);

  const movedDuringDragRef =
    useRef(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  const resetStatus = useCallback(() => {
    setStatus("idle");
  }, []);

  const startListening = useCallback(() => {
    setStatus("listening");
  }, []);

  const startThinking = useCallback(() => {
    setStatus("thinking");
  }, []);

  const startSpeaking = useCallback(() => {
    setStatus("speaking");
  }, []);

  const beginDrag = useCallback(
    (
      pointerX: number,
      pointerY: number,
    ) => {
      dragStartRef.current = {
        pointerX,
        pointerY,
        startX: position.x,
        startY: position.y,
      };

      movedDuringDragRef.current = false;
      setIsDragging(true);
    },
    [position],
  );

  const moveDrag = useCallback(
    (
      pointerX: number,
      pointerY: number,
    ) => {
      const dragStart =
        dragStartRef.current;

      if (!dragStart) {
        return;
      }

      const deltaX =
        pointerX - dragStart.pointerX;

      const deltaY =
        pointerY - dragStart.pointerY;

      if (
        Math.abs(deltaX) > 3 ||
        Math.abs(deltaY) > 3
      ) {
        movedDuringDragRef.current = true;
      }

      setPosition(
        clampPosition(
          {
            x: dragStart.startX + deltaX,
            y: dragStart.startY + deltaY,
          },
          bubbleSize,
          screenPadding,
        ),
      );
    },
    [bubbleSize, screenPadding],
  );

  const endDrag = useCallback(() => {
    dragStartRef.current = null;
    setIsDragging(false);
  }, []);

  const setAssistantPosition =
    useCallback(
      (
        nextPosition: FloatingAssistantPosition,
      ) => {
        setPosition(
          clampPosition(
            nextPosition,
            bubbleSize,
            screenPadding,
          ),
        );
      },
      [bubbleSize, screenPadding],
    );

  const consumeDragClick =
    useCallback((): boolean => {
      const wasDragged =
        movedDuringDragRef.current;

      movedDuringDragRef.current = false;

      return wasDragged;
    }, []);

  useEffect(() => {
    const handleResize = () => {
      setPosition((currentPosition) =>
        clampPosition(
          currentPosition,
          bubbleSize,
          screenPadding,
        ),
      );
    };

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, [bubbleSize, screenPadding]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handlePointerMove = (
      event: PointerEvent,
    ) => {
      moveDrag(
        event.clientX,
        event.clientY,
      );
    };

    const handlePointerUp = () => {
      endDrag();
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp,
    );

    window.addEventListener(
      "pointercancel",
      handlePointerUp,
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove,
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp,
      );

      window.removeEventListener(
        "pointercancel",
        handlePointerUp,
      );
    };
  }, [
    endDrag,
    isDragging,
    moveDrag,
  ]);

  return {
    isOpen,
    isDragging,
    status,
    position,

    open,
    close,
    toggle,

    setStatus,
    resetStatus,
    startListening,
    startThinking,
    startSpeaking,

    beginDrag,
    moveDrag,
    endDrag,
    consumeDragClick,
    setPosition: setAssistantPosition,
  };
}
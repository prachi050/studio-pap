type StudioPapLogoProps = {
  size?: number;
  showName?: boolean;
  className?: string;
};

export function StudioPapLogo({
  size = 54,
  showName = true,
  className = "",
}: StudioPapLogoProps) {
  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      aria-label="Studio PAP"
    >
      <img
        src={`${import.meta.env.BASE_URL}studio-pap-logo.svg`}
        alt="Studio PAP logo"
        width={size}
        height={size}
        draggable={false}
        className="block shrink-0 select-none object-contain"
      />

      {showName && (
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold tracking-[0.18em] text-[var(--text-primary)]">
            STUDIO PAP
          </span>

          <span className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
            AI Design Assistant
          </span>
        </div>
      )}
    </div>
  );
}
"use client";

type LoadingButtonProps = {
  loading: boolean;
  loadingText: string;
  idleText: string;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

export function LoadingButton({
  loading,
  loadingText,
  idleText,
  className = "",
  type = "button",
  disabled,
  onClick,
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {loadingText}
        </>
      ) : (
        idleText
      )}
    </button>
  );
}

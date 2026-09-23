export default function LoadingSpinner({ size = 'md', label = 'Memuat...' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8" role="status">
      <div
        className={`${sizeClasses[size]} rounded-full border-border border-t-primary animate-spin`}
      />
      {label && (
        <p className="text-sm text-muted">{label}</p>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}

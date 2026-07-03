/** Route-level loading fallback. Kept minimal for the scaffold. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

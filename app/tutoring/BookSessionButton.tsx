import Link from "next/link";

interface BookSessionButtonProps {
  tutorId: string;
}

export default function BookSessionButton({ tutorId }: BookSessionButtonProps) {
  return (
    <Link
      href={`/tutoring/book/${tutorId}`}
      className="rounded-xl bg-tertiary text-text-primary px-4 py-2 font-label-md font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95 flex items-center gap-2 text-center"
    >
      Book Session
    </Link>
  );
}

"use client";

interface MascotProps {
  pose?: "idle" | "celebrate" | "empty" | "encouraging" | "waving" | "thinking" | "pointing" | "teaching" | "learning" | "social" | "tutoring" | "reading" | "writing" | "listening";
  size?: number;
  className?: string;
  animateAssembly?: boolean;
  message?: string;
  context?: "learning" | "tutoring" | "social" | "gamification" | "admin";
}

export default function Mascot({ pose = "idle", size = 64, className = "", animateAssembly = false, message, context }: MascotProps) {
  const getPosePath = () => {
    switch (pose) {
      case "celebrate":
        return (
          <g>
            {/* Arms raised in celebration */}
            <path d="M20 30 L10 15" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            <path d="M44 30 L54 15" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            {/* Confetti particles */}
            <circle cx="10" cy="10" r="3" fill="#FF9600" className="animate-pulse" />
            <circle cx="54" cy="10" r="3" fill="#22C55E" className="animate-pulse" />
            <circle cx="8" cy="20" r="2" fill="#8B5CF6" className="animate-pulse" />
            <circle cx="56" cy="20" r="2" fill="#FF6B6B" className="animate-pulse" />
          </g>
        );
      case "empty":
        return (
          <g>
            {/* Arms down, sad expression */}
            <path d="M20 35 L15 45" stroke="#8B8578" strokeWidth="4" strokeLinecap="round" />
            <path d="M44 35 L49 45" stroke="#8B8578" strokeWidth="4" strokeLinecap="round" />
            {/* Sad mouth */}
            <path d="M28 42 Q32 38 36 42" stroke="#8B8578" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        );
      case "encouraging":
        return (
          <g>
            {/* One arm pointing forward */}
            <path d="M44 30 L58 25" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            <path d="M20 35 L15 40" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            {/* Thumbs up hand */}
            <circle cx="58" cy="25" r="4" fill="#22C55E" />
          </g>
        );
      case "waving":
        return (
          <g>
            {/* One arm waving */}
            <path d="M44 30 L58 20" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" className="animate-bounce" />
            <path d="M20 35 L15 40" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            {/* Waving hand */}
            <circle cx="58" cy="20" r="4" fill="#22C55E" />
          </g>
        );
      case "thinking":
        return (
          <g>
            {/* Arms crossed, thinking pose */}
            <path d="M20 32 L25 28" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            <path d="M44 32 L39 28" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            {/* Thought bubble */}
            <circle cx="58" cy="15" r="6" fill="#FFFFFF" stroke="#8B8578" strokeWidth="2" />
            <circle cx="52" cy="22" r="3" fill="#FFFFFF" stroke="#8B8578" strokeWidth="2" />
            <circle cx="48" cy="26" r="2" fill="#FFFFFF" stroke="#8B8578" strokeWidth="2" />
          </g>
        );
      case "pointing":
        return (
          <g>
            {/* One arm pointing right */}
            <path d="M44 30 L60 30" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            <path d="M20 35 L15 40" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            {/* Pointing finger */}
            <circle cx="60" cy="30" r="3" fill="#22C55E" />
          </g>
        );
      case "teaching":
        return (
          <g>
            {/* Holding a pointer/stick */}
            <path d="M44 30 L58 20" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            <path d="M20 35 L15 40" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            {/* Pointer stick */}
            <line x1="58" y1="20" x2="65" y2="10" stroke="#8B5CF6" strokeWidth="3" />
            <circle cx="65" cy="10" r="2" fill="#8B5CF6" />
            {/* Book/whiteboard */}
            <rect x="50" y="35" width="12" height="8" fill="#FFFFFF" stroke="#8B8578" strokeWidth="1" />
          </g>
        );
      case "learning":
        return (
          <g>
            {/* Holding a book */}
            <path d="M20 35 L15 40" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            <path d="M44 35 L49 40" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            {/* Open book */}
            <rect x="28" y="38" width="8" height="10" fill="#FFFFFF" stroke="#8B8578" strokeWidth="1" />
            <line x1="32" y1="38" x2="32" y2="48" stroke="#8B8578" strokeWidth="1" />
            {/* Sparkles for learning */}
            <circle cx="20" cy="25" r="2" fill="#FFD700" className="animate-pulse" />
            <circle cx="44" cy="25" r="2" fill="#FFD700" className="animate-pulse" />
          </g>
        );
      case "social":
        return (
          <g>
            {/* One arm waving hello */}
            <path d="M44 30 L58 15" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" className="animate-bounce" />
            <path d="M20 35 L15 40" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            {/* Chat bubble */}
            <rect x="50" y="5" width="14" height="10" rx="2" fill="#FFFFFF" stroke="#8B8578" strokeWidth="1" />
            <circle cx="54" cy="10" r="1" fill="#8B8578" />
            <circle cx="57" cy="10" r="1" fill="#8B8578" />
            <circle cx="60" cy="10" r="1" fill="#8B8578" />
          </g>
        );
      case "tutoring":
        return (
          <g>
            {/* Holding a certificate/award */}
            <path d="M20 32 L15 38" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            <path d="M44 32 L49 38" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            {/* Certificate */}
            <rect x="26" y="36" width="12" height="8" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
            <path d="M29 40 L32 43 L35 38" stroke="#FFFFFF" strokeWidth="1" fill="none" />
          </g>
        );
      case "reading":
        return (
          <g>
            {/* Looking down at a book */}
            <path d="M20 35 L18 42" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            <path d="M44 35 L46 42" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            {/* Large book below */}
            <rect x="24" y="44" width="16" height="6" fill="#FFFFFF" stroke="#8B8578" strokeWidth="1" />
            <line x1="32" y1="44" x2="32" y2="50" stroke="#8B8578" strokeWidth="1" />
          </g>
        );
      case "writing":
        return (
          <g>
            {/* Holding a pencil */}
            <path d="M44 30 L55 25" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            <path d="M20 35 L15 40" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            {/* Pencil */}
            <line x1="55" y1="25" x2="62" y2="18" stroke="#FF9600" strokeWidth="3" />
            <polygon points="62,18 64,16 65,18 63,20" fill="#FF9600" />
            {/* Paper */}
            <rect x="50" y="32" width="10" height="8" fill="#FFFFFF" stroke="#8B8578" strokeWidth="1" />
          </g>
        );
      case "listening":
        return (
          <g>
            {/* Hands cupped near ears */}
            <path d="M20 30 L12 25" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            <path d="M44 30 L52 25" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            {/* Sound waves */}
            <path d="M8 22 Q5 25 8 28" stroke="#8B5CF6" strokeWidth="2" fill="none" className="animate-pulse" />
            <path d="M6 20 Q2 25 6 30" stroke="#8B5CF6" strokeWidth="2" fill="none" className="animate-pulse" />
            <path d="M56 22 Q59 25 56 28" stroke="#8B5CF6" strokeWidth="2" fill="none" className="animate-pulse" />
            <path d="M58 20 Q62 25 58 30" stroke="#8B5CF6" strokeWidth="2" fill="none" className="animate-pulse" />
          </g>
        );
      default: // idle
        return (
          <g>
            {/* Arms at sides */}
            <path d="M20 32 L15 42" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
            <path d="M44 32 L49 42" stroke="#3C9A00" strokeWidth="4" strokeLinecap="round" />
          </g>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Assembly animation classes */}
      <style jsx>{`
        @keyframes assembleHead {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes assembleBody {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes assembleArms {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes assembleLegs {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .assemble-head { animation: assembleHead 0.4s ease-out forwards; }
        .assemble-body { animation: assembleBody 0.4s ease-out 0.2s forwards; opacity: 0; }
        .assemble-arms { animation: assembleArms 0.3s ease-out 0.4s forwards; opacity: 0; }
        .assemble-legs { animation: assembleLegs 0.3s ease-out 0.5s forwards; opacity: 0; }
        .breathing { animation: bounce 2s ease-in-out infinite; }
      `}</style>
      {/* LEGO-style head */}
      <g className={animateAssembly ? "assemble-head" : pose === "idle" ? "breathing" : ""}>
        <rect x="16" y="8" width="32" height="28" rx="4" fill="#22C55E" />
        {/* Stud on top */}
        <rect x="28" y="4" width="8" height="6" rx="2" fill="#58CC02" />
        
        {/* Face */}
        {/* Eyes */}
        <circle cx="24" cy="22" r="4" fill="#FFFFFF" />
        <circle cx="40" cy="22" r="4" fill="#FFFFFF" />
        <circle cx="25" cy="23" r="2" fill="#2D2A26" />
        <circle cx="41" cy="23" r="2" fill="#2D2A26" />
        
        {/* Mouth */}
        {pose === "empty" ? (
          <path d="M28 30 Q32 26 36 30" stroke="#8B8578" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M28 30 Q32 34 36 30" stroke="#2D2A26" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
      </g>
      
      {/* Body */}
      <g className={animateAssembly ? "assemble-body" : ""}>
        <rect x="20" y="36" width="24" height="20" rx="3" fill="#3C9A00" />
      </g>
      
      {/* Arms and pose-specific elements */}
      <g className={animateAssembly ? "assemble-arms" : ""}>
        {getPosePath()}
      </g>
      
      {/* Legs */}
      <g className={animateAssembly ? "assemble-legs" : ""}>
        <rect x="22" y="56" width="8" height="6" rx="2" fill="#2D2A26" />
        <rect x="34" y="56" width="8" height="6" rx="2" fill="#2D2A26" />
      </g>

      {/* Speech bubble for messages */}
      {message && (
        <g className="animate-pulse">
          <rect x="70" y="5" width={Math.min(message.length * 6 + 20, 120)} height="24" rx="6" fill="#FFFFFF" stroke="#8B8578" strokeWidth="2" />
          <polygon points="70,17 64,20 70,23" fill="#FFFFFF" stroke="#8B8578" strokeWidth="2" />
          <text x={80} y={21} fontSize="10" fill="#2D2A26" fontFamily="Arial, sans-serif">
            {message.length > 15 ? message.substring(0, 15) + "..." : message}
          </text>
        </g>
      )}

      {/* Context-specific accessories */}
      {context === "learning" && (
        <g>
          {/* Graduation cap */}
          <rect x="24" y="2" width="16" height="4" fill="#2D2A26" />
          <rect x="30" y="0" width="4" height="4" fill="#2D2A26" />
          <circle cx="38" cy="4" r="2" fill="#FFD700" />
        </g>
      )}
      {context === "tutoring" && (
        <g>
          {/* Glasses */}
          <rect x="22" y="20" width="8" height="6" rx="1" fill="none" stroke="#2D2A26" strokeWidth="1.5" />
          <rect x="34" y="20" width="8" height="6" rx="1" fill="none" stroke="#2D2A26" strokeWidth="1.5" />
          <line x1="30" y1="23" x2="34" y2="23" stroke="#2D2A26" strokeWidth="1.5" />
        </g>
      )}
      {context === "social" && (
        <g>
          {/* Heart accessory */}
          <path d="M10 10 C10 8 12 6 14 8 C16 10 18 8 20 10 C20 12 18 14 16 16 L14 18 L12 16 C10 14 8 12 10 10" fill="#FF6B6B" />
        </g>
      )}
      {context === "gamification" && (
        <g>
          {/* Trophy/star */}
          <path d="M54 8 L56 12 L60 12 L57 15 L58 19 L54 17 L50 19 L51 15 L48 12 L52 12 Z" fill="#FFD700" />
        </g>
      )}
      {context === "admin" && (
        <g>
          {/* Crown */}
          <path d="M20 6 L24 2 L28 6 L32 2 L36 6 L40 2 L44 6 L44 10 L20 10 Z" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}

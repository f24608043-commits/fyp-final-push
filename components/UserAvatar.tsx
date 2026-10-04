import React from "react";
import Image from "next/image";

interface UserAvatarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function UserAvatar({
  avatarUrl,
  displayName,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-xl",
  };

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (avatarUrl) {
    const sizeMap = {
      sm: 32,
      md: 48,
      lg: 64,
    };
    return (
      <Image
        src={avatarUrl}
        alt={displayName || "User"}
        width={sizeMap[size]}
        height={sizeMap[size]}
        className={`${sizes[size]} rounded-full object-cover border-2 border-surface-border ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary to-secondary text-text-primary font-bold flex items-center justify-center border-2 border-surface-border ${className}`}
    >
      {initials}
    </div>
  );
}

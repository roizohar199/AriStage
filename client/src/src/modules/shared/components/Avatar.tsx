import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { getAvatarInitial } from "@/modules/shared/lib/avatar";

export type AvatarProps = {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  alt?: string;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  fallback?: string;
};

export default function Avatar({
  src,
  name,
  email,
  alt = "Avatar",
  className = "",
  imgClassName = "",
  fallbackClassName = "",
  fallback = "A",
}: AvatarProps): ReactElement {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const initial = useMemo(() => {
    return getAvatarInitial(name || email, fallback);
  }, [name, email, fallback]);

  const showImage = Boolean(src) && !failed;

  return (
    <div className={className} aria-label={alt}>
      {showImage ? (
        <img
          src={src as string}
          alt={alt}
          className={imgClassName}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={fallbackClassName}>{initial}</span>
      )}
    </div>
  );
}

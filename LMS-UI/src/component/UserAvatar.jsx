import React, { useState, useEffect } from "react";

// ✅ 1. Reliable Fallback (UI Avatars generates initials)
const FALLBACK_IMAGE = "https://ui-avatars.com/api/?name=User&background=random&color=fff";
const BACKEND_URL = "http://localhost:5000";

const UserAvatar = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(FALLBACK_IMAGE);

  // ✅ 2. Logic to determine initial image source
  useEffect(() => {
    if (!src || src === "undefined" || src === "null") {
      setImgSrc(FALLBACK_IMAGE);
    } else if (src.startsWith("http") || src.startsWith("blob")) {
      setImgSrc(src);
    } else {
      // It's a relative path from backend
      setImgSrc(`${BACKEND_URL}${src}`);
    }
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt || "User Avatar"}
      className={className}
      // ✅ 3. Loop Protection: Only switch to fallback if not already there
      onError={(e) => {
        if (e.target.src !== FALLBACK_IMAGE) {
          e.target.src = FALLBACK_IMAGE;
          setImgSrc(FALLBACK_IMAGE); // Update state to reflect change
        }
      }}
    />
  );
};

export default UserAvatar;
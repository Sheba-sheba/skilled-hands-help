import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Resolve a stored avatar value to a displayable URL.
// - If it looks like an absolute URL (legacy), return as-is.
// - Otherwise treat as a storage path inside the private "avatars" bucket
//   and return a short-lived signed URL.
export function useAvatarUrl(value: string | null | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setUrl(undefined);
      return;
    }
    if (/^https?:\/\//i.test(value)) {
      setUrl(value);
      return;
    }
    (async () => {
      const { data } = await supabase.storage
        .from("avatars")
        .createSignedUrl(value, 60 * 60);
      if (!cancelled) setUrl(data?.signedUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  return url;
}

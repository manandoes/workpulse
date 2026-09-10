"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar } from "@/components/dashboard/avatar";
import { Button } from "@/components/ui/button";

const AVATAR_SIZE = 128;

/**
 * Lets the signed-in user set or remove their own profile photo.
 *
 * No object storage exists in this project (see .env.example), so the image
 * is resized to a small square on the canvas, re-encoded as a JPEG data URL,
 * and stored directly on the person's own row (`avatarUrl`).
 */
export function AvatarUpload({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(avatarUrl);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await resizeToDataUrl(file, AVATAR_SIZE);

      const response = await fetch("/api/profile/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(body?.error ?? "Could not update your photo.");
        return;
      }

      setPreview(dataUrl);
      toast.success("Profile photo updated.");
      router.refresh();
    } catch {
      toast.error("Could not read that image.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setBusy(true);
    const response = await fetch("/api/profile/avatar", { method: "DELETE" });
    setBusy(false);

    if (!response.ok) {
      toast.error("Could not remove your photo.");
      return;
    }

    setPreview(null);
    toast.success("Profile photo removed.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} avatarUrl={preview} className="size-16 text-base" />

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Working…" : preview ? "Change photo" : "Upload photo"}
          </Button>
          {preview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={handleRemove}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Downscales and center-crops `file` to a square JPEG data URL. */
function resizeToDataUrl(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas is not supported."));
        return;
      }

      const side = Math.min(image.width, image.height);
      const sx = (image.width - side) / 2;
      const sy = (image.height - side) / 2;
      ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);

      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load that image."));
    };

    image.src = objectUrl;
  });
}

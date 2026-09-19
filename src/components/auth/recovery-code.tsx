"use client";
import { useEffect, useState } from "react";
export function RecoveryCode() {
  const [code, setCode] = useState("");
  useEffect(() => { setCode(window.sessionStorage.getItem("detectgrowth-recovery-code") ?? ""); }, []);
  if (!code) return null;
  return <section className="my-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><h2 className="font-semibold">Save your recovery code</h2><p className="mt-2 text-xs leading-5">Keep this code somewhere private. It lets you reset your password if you forget it. Each reset issues a new code.</p><code className="my-3 block select-all break-all rounded-lg bg-white p-3 text-xs">{code}</code><button type="button" className="min-h-11 font-medium underline" onClick={() => { window.sessionStorage.removeItem("detectgrowth-recovery-code"); setCode(""); }}>I have saved my code</button></section>;
}

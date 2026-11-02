import type { Metadata } from "next";
import { Suspense } from "react";
import { company } from "@/data/company";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "giriş" };

export default function GirisPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-[360px]">
        <p className="font-display text-[22px] leading-none">{company.shortName}</p>
        <h1 className="mt-10 font-display text-[40px] leading-[1.05] tracking-[-0.01em]">asistan paneline hoş geldiniz.</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">Devam etmek için şifrenizi girin.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

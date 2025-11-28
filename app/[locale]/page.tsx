"use client";

import { NetworkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { GithubButton } from "@/components/github-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BorderBeam } from "@/components/magicui/border-beam";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { ShineBorder } from "@/components/magicui/shine-border";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { NATDetector } from "@/components/nat-checker/detector";
import { AnimatedThemeToggler } from "@/components/theme-switch";
import { useNATDetection } from "@/hooks/use-nat-detection";
import { DetectionState } from "@/lib/nat-detection/types";
import { cn } from "@/lib/utils";

export default function Home() {
  const t = useTranslations("UIStrings");
  const { result, runDetection } = useNATDetection();

  const isSuccess = result.state === DetectionState.SUCCESS;

  const content = (
    <>
      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <div className="flex flex-col items-center justify-center gap-3 mb-2">
          <NetworkIcon className="size-12 text-primary mb-4" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 dark:from-neutral-100 dark:to-neutral-500">
            <TypingAnimation
              className="text-4xl sm:text-6xl font-bold text-foreground"
              duration={50}
            >
              {t("appTitle")}
            </TypingAnimation>
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t("appDescription")}
        </p>
        {/* <p className="text-sm text-muted-foreground">{t("privacyNote")}</p> */}
      </div>

      {/* Main Detection Component */}
      <div className="flex justify-center">
        <NATDetector result={result} onRunDetection={runDetection} />
      </div>

      {/* Footer Information */}
      <div className="mt-16 text-center text-sm text-muted-foreground space-y-2">
        <p>{t("footerInfo")}</p>
      </div>
    </>
  );

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
        )}
      />

      {/* Theme Toggle and Language Switcher in Top Right */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <LanguageSwitcher />
        <GithubButton />
        <AnimatedThemeToggler />
      </div>

      <main className="container relative mx-auto px-4 pt-20 pb-12 max-w-5xl z-10">
        {isSuccess ? (
          <div className="relative rounded-xl border-none bg-background/50 backdrop-blur-sm p-8 md:p-12 shadow-2xl overflow-hidden">
            <ShineBorder
              className="absolute inset-0 size-full"
              shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
            />
            <div className="relative z-10">{content}</div>
          </div>
        ) : (
          <div className="relative rounded-xl border bg-background/50 backdrop-blur-sm p-8 md:p-12 shadow-2xl">
            <BorderBeam size={250} duration={12} delay={9} />
            {content}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GithubButton() {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      asChild
      className="text-muted-foreground hover:text-foreground"
    >
      <a
        href="https://github.com/xiaopeng-ye/nat-checker"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View on GitHub"
      >
        <Github className="size-4" />
      </a>
    </Button>
  );
}

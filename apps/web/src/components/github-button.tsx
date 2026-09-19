import GithubIcon from "@hugeicons/core-free-icons/GithubIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * 外观是按钮，实际渲染为真正的链接。
 * shadcn 文档 "As Link"：不要用 `<Button render={<a />} nativeButton={false} />`，
 * Base UI 的 Button 会强制加上 role="button"，覆盖 <a> 的链接语义；
 * 需要按钮样式的链接应直接用 `buttonVariants` 修饰 <a>。
 */
export function GithubButton() {
  return (
    <a
      href="https://github.com/xiaopeng-ye/nat-checker"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View on GitHub"
      className={cn(
        buttonVariants({ variant: "default", size: "icon-sm" }),
        "rounded-full"
      )}
    >
      <HugeiconsIcon icon={GithubIcon} />
    </a>
  )
}

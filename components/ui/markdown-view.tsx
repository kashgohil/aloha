import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export { markdownToPlain } from "@/lib/markdown";

type Props = {
  children: string;
  className?: string;
  compact?: boolean;
  clamp?: number;
};

export function MarkdownView({ children, className, compact, clamp }: Props) {
  const style =
    typeof clamp === "number"
      ? ({
          display: "-webkit-box",
          WebkitLineClamp: clamp,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        } as React.CSSProperties)
      : undefined;

  return (
    <div
      className={cn("prose-aloha", compact && "prose-aloha--compact", className)}
      style={style}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: kids, ...rest }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              {...rest}
            >
              {kids}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}


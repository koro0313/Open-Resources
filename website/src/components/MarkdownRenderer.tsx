import { useEffect, useRef, useState } from "react"
import { marked } from "marked"
import mermaid from "mermaid"

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
})

// Configure marked with GFM default
marked.use({
  gfm: true,
  breaks: false,
})

interface MermaidProps {
  chart: string;
  isDark: boolean;
}

export function Mermaid({ chart, isDark }: MermaidProps) {
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  
  // Create a stable random ID for the diagram container
  const idRef = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`)

  useEffect(() => {
    let active = true

    // Re-initialize theme based on theme mode
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
      themeVariables: isDark ? {
        background: "#0a0a0a",
        primaryColor: "#ff385c",
        lineColor: "#2c2c2c",
      } : {
        background: "#ffffff",
        primaryColor: "#ff385c",
        lineColor: "#dddddd",
      }
    })

    try {
      mermaid.render(idRef.current, chart)
        .then((result) => {
          if (active) {
            setSvg(result.svg)
            setError(null)
          }
        })
        .catch((err) => {
          console.warn("Mermaid parsing error:", err)
          if (active) {
            setError("Diagram syntax is incomplete...")
          }
        })
    } catch (err) {
      console.warn("Mermaid parsing exception:", err)
      if (active) {
        setError("Diagram syntax is incomplete...")
      }
    }

    return () => {
      active = false
    }
  }, [chart, isDark])

  if (error) {
    return (
      <div className="my-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-mono text-xs max-w-full overflow-x-auto select-none">
        <div className="font-semibold mb-1">Mermaid Syntax Note</div>
        <pre className="text-[10px] mt-1 opacity-70 whitespace-pre-wrap">{chart}</pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="my-6 p-6 flex justify-center items-center border rounded-lg bg-neutral-50 dark:bg-neutral-900/30 border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 select-none">
        Rendering diagram...
      </div>
    )
  }

  return (
    <div 
      className="my-6 p-4 rounded-lg bg-white dark:bg-[#0a0a0a] border border-neutral-100 dark:border-neutral-900 shadow-sm flex justify-center overflow-x-auto max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

interface MarkdownRendererProps {
  content: string;
  isDark?: boolean;
  className?: string;
}

export default function MarkdownRenderer({ content, isDark = false, className = "" }: MarkdownRendererProps) {
  // Split content by mermaid code blocks to parse them separately
  const parts = content.split(/(```mermaid[\s\S]*?```)/g)

  return (
    <div className={className} style={className ? undefined : { display: "contents" }}>
      {parts.map((part, index) => {
        if (part.startsWith("```mermaid")) {
          // Extract the diagram code
          const lines = part.split("\n")
          const chart = lines.slice(1, lines.length - 1).join("\n").trim()
          return <Mermaid key={index} chart={chart} isDark={isDark} />
        } else {
          // Parse regular markdown using marked
          try {
            const html = marked.parse(part) as string
            return (
              <div 
                key={index} 
                style={{ display: "contents" }}
                dangerouslySetInnerHTML={{ __html: html }} 
              />
            )
          } catch (e) {
            console.error("Markdown parse error:", e)
            return <pre key={index}>{part}</pre>
          }
        }
      })}
    </div>
  )
}

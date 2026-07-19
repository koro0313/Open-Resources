import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import MarkdownRenderer from "@/components/MarkdownRenderer"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Type,
  Loader2,
  BookOpen,
  Settings,
  AlignLeft,
  AlignJustify,
  BookmarkCheck
} from "lucide-react"

interface BookPage {
  filename: string;
  title: string;
  content: string;
  wordCount: number;
  slug: string;
}

interface ReadingTheme {
  name: string;
  bg: string;
  fg: string;
  paperBg: string;
  paperFg: string;
  paperText: string;
  border: string;
  sidebarBg: string;
  headerBg: string;
  codeBg: string;
  isDark: boolean;
}

const READER_THEMES: Record<string, ReadingTheme> = {
  light: {
    name: "Light",
    bg: "#f7f7f7",
    fg: "#222222",
    paperBg: "#ffffff",
    paperFg: "#222222",
    paperText: "#3f3f3f",
    border: "#e5e5e5",
    sidebarBg: "#ffffff",
    headerBg: "rgba(255, 255, 255, 0.85)",
    codeBg: "#f5f5f5",
    isDark: false,
  },
  sepia: {
    name: "Sepia",
    bg: "#f4edd8",
    fg: "#433422",
    paperBg: "#fbf6eb",
    paperFg: "#433422",
    paperText: "#5c4831",
    border: "#e6dcbe",
    sidebarBg: "#fbf6eb",
    headerBg: "rgba(251, 246, 235, 0.85)",
    codeBg: "#ede6d0",
    isDark: false,
  },
  sage: {
    name: "Sage",
    bg: "#e7eeeb",
    fg: "#1e3328",
    paperBg: "#f4f7f6",
    paperFg: "#1e3328",
    paperText: "#2d4d3d",
    border: "#cbdad2",
    sidebarBg: "#f4f7f6",
    headerBg: "rgba(244, 247, 246, 0.85)",
    codeBg: "#e0e7e3",
    isDark: false,
  },
  solarized: {
    name: "Solarized",
    bg: "#eee8d5",
    fg: "#073642",
    paperBg: "#fdf6e3",
    paperFg: "#073642",
    paperText: "#586e75",
    border: "#d3c7a1",
    sidebarBg: "#fdf6e3",
    headerBg: "rgba(253, 246, 227, 0.85)",
    codeBg: "#eee8d5",
    isDark: false,
  },
  slate: {
    name: "Slate",
    bg: "#1e2433",
    fg: "#cbd5e1",
    paperBg: "#161b26",
    paperFg: "#cbd5e1",
    paperText: "#94a3b8",
    border: "#2d3548",
    sidebarBg: "#161b26",
    headerBg: "rgba(22, 27, 38, 0.85)",
    codeBg: "#222836",
    isDark: true,
  },
  ocean: {
    name: "Ocean",
    bg: "#0f172a",
    fg: "#e2e8f0",
    paperBg: "#020617",
    paperFg: "#e2e8f0",
    paperText: "#94a3b8",
    border: "#1e293b",
    sidebarBg: "#020617",
    headerBg: "rgba(2, 6, 23, 0.85)",
    codeBg: "#0f172a",
    isDark: true,
  },
  dark: {
    name: "Dark",
    bg: "#121212",
    fg: "#e5e5e5",
    paperBg: "#0a0a0a",
    paperFg: "#e5e5e5",
    paperText: "#a3a3a3",
    border: "#2a2a2a",
    sidebarBg: "#0a0a0a",
    headerBg: "rgba(10, 10, 10, 0.85)",
    codeBg: "#1c1c1c",
    isDark: true,
  },
}



export default function Reader() {
  const { docId, pageName } = useParams<{ docId: string; pageName?: string }>()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const [pages, setPages] = useState<BookPage[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Derived state: find active page by slug from the URL
  const currentPageIndex = pageName
    ? pages.findIndex((p) => p.slug === pageName)
    : -1

  // Sidebar & Settings UI State
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768
    }
    return false
  })
  const [showSettings, setShowSettings] = useState<boolean>(false)

  // Reading Preferences state (loaded from localStorage or fallback defaults)
  const [readerTheme, setReaderTheme] = useState<string>(() => {
    return localStorage.getItem("reader-theme") || "light"
  })
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">(() => {
    return (localStorage.getItem("reader-font-family") as any) || "serif"
  })
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("reader-font-size")
    return saved ? parseInt(saved, 10) : 18
  })
  const [lineHeight, setLineHeight] = useState<"compact" | "normal" | "relaxed">(() => {
    return (localStorage.getItem("reader-line-height") as any) || "normal"
  })
  const [alignment, setAlignment] = useState<"left" | "justify">(() => {
    return (localStorage.getItem("reader-alignment") as any) || "left"
  })
  const [readerWidth, setReaderWidth] = useState<"compact" | "normal" | "wide">(() => {
    return (localStorage.getItem("reader-width") as any) || "normal"
  })

  // Scroll visibility state
  const [isScrollingDown, setIsScrollingDown] = useState<boolean>(false)
  const [lastScrollTop, setLastScrollTop] = useState<number>(0)

  // Convert docId slug to display title
  const bookTitle = docId
    ? docId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
    : "Book Reader"

  // Persist preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem("reader-theme", readerTheme)
  }, [readerTheme])

  useEffect(() => {
    localStorage.setItem("reader-font-family", fontFamily)
  }, [fontFamily])

  useEffect(() => {
    localStorage.setItem("reader-font-size", fontSize.toString())
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem("reader-line-height", lineHeight)
  }, [lineHeight])

  useEffect(() => {
    localStorage.setItem("reader-alignment", alignment)
  }, [alignment])

  useEffect(() => {
    localStorage.setItem("reader-width", readerWidth)
  }, [readerWidth])

  // Sync reading theme's dark/light nature with the global app theme provider
  useEffect(() => {
    const activeTheme = READER_THEMES[readerTheme] || READER_THEMES.light
    if (activeTheme.isDark && theme !== "dark") {
      setTheme("dark")
    } else if (!activeTheme.isDark && theme !== "light") {
      setTheme("light")
    }
  }, [readerTheme, theme, setTheme])

  useEffect(() => {
    async function loadBookData() {
      if (!docId) return
      setLoading(true)
      setError(null)
      try {
        // Step 1: Fetch contents.txt
        const listPath = `/${docId}/contents.txt`
        const listResponse = await fetch(listPath)
        if (!listResponse.ok) {
          throw new Error(`Failed to load Table of Contents from ${listPath}. Ensure it exists in the public directory.`)
        }
        const listText = await listResponse.text()
        const filenames = listText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)

        if (filenames.length === 0) {
          throw new Error("The contents.txt file is empty.")
        }

        // Step 2: Fetch markdown files
        const loadedPages: BookPage[] = []
        for (const filename of filenames) {
          const filePath = `/${docId}/${encodeURIComponent(filename)}`
          const fileResponse = await fetch(filePath)
          if (!fileResponse.ok) {
            throw new Error(`Failed to fetch page: ${filename}`)
          }
          const content = await fileResponse.text()

          // Extract first H1 as title
          const titleLine = content.split("\n").find((line) => line.trim().startsWith("#"))
          let parsedTitle = titleLine
            ? titleLine.replace(/^#+\s+/, "").trim()
            : filename.replace(/\.md$/, "")

          if (
            parsedTitle === "What is Open Education Model" ||
            parsedTitle === "How does this model work" ||
            parsedTitle === "How to make it a reality"
          ) {
            parsedTitle += "?"
          }

          const words = content.trim().split(/\s+/).filter(Boolean).length
          const slug = filename
            .replace(/\.md$/, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")

          loadedPages.push({
            filename,
            title: parsedTitle,
            content,
            wordCount: words,
            slug,
          })
        }

        setPages(loadedPages)
      } catch (err: any) {
        console.error(err)
        setError(err.message || "An error occurred while loading the book.")
      } finally {
        setLoading(false)
      }
    }

    loadBookData()
  }, [docId])

  // Handle keypresses for navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (loading || error || pages.length === 0 || !pageName || currentPageIndex === -1) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === "ArrowLeft") {
        const prevIdx = Math.max(0, currentPageIndex - 1)
        const prevPage = pages[prevIdx]
        if (prevPage && prevIdx !== currentPageIndex) {
          navigate(`/reader/${docId}/${prevPage.slug}`)
          document.getElementById("reader-main")?.scrollTo({ top: 0 })
        }
      } else if (e.key === "ArrowRight") {
        const nextIdx = Math.min(pages.length - 1, currentPageIndex + 1)
        const nextPage = pages[nextIdx]
        if (nextPage && nextIdx !== currentPageIndex) {
          navigate(`/reader/${docId}/${nextPage.slug}`)
          document.getElementById("reader-main")?.scrollTo({ top: 0 })
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [pages, loading, error, currentPageIndex, docId, pageName, navigate])

  // Reset scroll state and scroll container to top on page change
  useEffect(() => {
    setIsScrollingDown(false)
    setLastScrollTop(0)
    document.getElementById("reader-main")?.scrollTo({ top: 0 })
  }, [pageName])

  // Reset scroll state when sidebar is opened
  useEffect(() => {
    if (sidebarOpen) {
      setIsScrollingDown(false)
    }
  }, [sidebarOpen])

  // Font class determinations
  const getFontClass = () => {
    if (fontFamily === "serif") return "font-serif"
    if (fontFamily === "mono") return "font-mono"
    return "font-sans"
  }

  // Get specific font styles
  const getFontFamilyStyle = () => {
    if (fontFamily === "serif") return { fontFamily: "Georgia, Cambria, 'Times New Roman', Times, serif" }
    if (fontFamily === "mono") return { fontFamily: "Menlo, Monaco, Consolas, 'Fira Code', monospace" }
    return { fontFamily: "'Inter Variable', system-ui, -apple-system, sans-serif" }
  }

  // Get line spacing styles
  const getLineHeightStyle = () => {
    if (lineHeight === "compact") return { lineHeight: "1.4" }
    if (lineHeight === "relaxed") return { lineHeight: "1.9" }
    return { lineHeight: "1.65" }
  }

  // Get reading container width class
  const getWidthClass = () => {
    if (readerWidth === "compact") return "max-w-xl"
    if (readerWidth === "wide") return "max-w-4xl"
    return "max-w-2xl"
  }

  const activePage = pages[currentPageIndex] || null
  const readProgress = pages.length > 0 ? ((currentPageIndex + 1) / pages.length) * 100 : 0
  const totalWords = pages.reduce((acc, p) => acc + p.wordCount, 0)

  // Scroll handler to hide/show UI elements
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    const scrollHeight = e.currentTarget.scrollHeight
    const clientHeight = e.currentTarget.clientHeight

    // Do not hide elements if the Table of Contents (sidebar) is open
    if (sidebarOpen) {
      setIsScrollingDown(false)
      setLastScrollTop(scrollTop)
      return
    }

    // Always show elements at the very top
    if (scrollTop <= 15) {
      setIsScrollingDown(false)
      setLastScrollTop(scrollTop)
      return
    }

    // Always show elements when reached the bottom (plus a buffer)
    if (scrollHeight - scrollTop <= clientHeight + 40) {
      setIsScrollingDown(false)
      setLastScrollTop(scrollTop)
      return
    }

    // Handle scroll direction detection
    if (Math.abs(scrollTop - lastScrollTop) > 6) {
      setIsScrollingDown(scrollTop > lastScrollTop)
      setLastScrollTop(scrollTop)
    }
  }

  const activeTheme = READER_THEMES[readerTheme] || READER_THEMES.light

  return (
    <div
      style={{
        "--reader-bg": activeTheme.bg,
        "--reader-fg": activeTheme.fg,
        "--reader-paper-bg": activeTheme.paperBg,
        "--reader-paper-fg": activeTheme.paperFg,
        "--reader-paper-text": activeTheme.paperText,
        "--reader-border": activeTheme.border,
        "--reader-sidebar-bg": activeTheme.sidebarBg,
        "--reader-header-bg": activeTheme.headerBg,
        "--reader-code-bg": activeTheme.codeBg,
      } as React.CSSProperties}
      className="reader-themed-root flex h-svh flex-col font-sans selection:bg-[#ff385c] selection:text-white"
    >
      <style>{`
        .reader-themed-root {
          background-color: var(--reader-bg) !important;
          color: var(--reader-fg) !important;
        }
        .reader-themed-header {
          background-color: var(--reader-header-bg) !important;
          border-color: var(--reader-border) !important;
          color: var(--reader-fg) !important;
        }
        .reader-themed-sidebar {
          background-color: var(--reader-sidebar-bg) !important;
          border-color: var(--reader-border) !important;
          color: var(--reader-fg) !important;
        }
        .reader-themed-sidebar-btn {
          color: var(--reader-paper-text) !important;
          border-color: transparent !important;
          background-color: transparent !important;
        }
        .reader-themed-sidebar-btn:hover {
          background-color: var(--reader-bg) !important;
          color: var(--reader-fg) !important;
        }
        .reader-themed-sidebar-btn-active {
          background-color: var(--reader-bg) !important;
          border-color: var(--reader-border) !important;
          color: var(--reader-fg) !important;
        }
        .reader-themed-main {
          background-color: var(--reader-bg) !important;
        }
        .reader-themed-paper {
          background-color: var(--reader-paper-bg) !important;
          border-color: var(--reader-border) !important;
          color: var(--reader-paper-fg) !important;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, ${activeTheme.isDark ? 0.35 : 0.04}) !important;
        }
        .reader-themed-btn {
          color: var(--reader-fg) !important;
        }
        .reader-themed-btn:hover {
          background-color: var(--reader-bg) !important;
        }
        .reader-themed-btn-active {
          color: #ff385c !important;
          background-color: var(--reader-bg) !important;
        }
        .reader-themed-border-divider {
          border-color: var(--reader-border) !important;
        }
        .reader-themed-footer {
          border-top-color: var(--reader-border) !important;
          background-color: var(--reader-sidebar-bg) !important;
          color: var(--reader-paper-text) !important;
        }
        /* Markdown formatting overrides */
        .markdown-preview p {
          color: var(--reader-paper-text) !important;
          line-height: inherit !important;
          font-family: inherit !important;
        }
        .markdown-preview h1,
        .markdown-preview h2,
        .markdown-preview h3,
        .markdown-preview h4,
        .markdown-preview h5,
        .markdown-preview h6 {
          color: var(--reader-paper-fg) !important;
          font-family: inherit !important;
          border-color: var(--reader-border) !important;
          text-align: left !important;
        }
        .markdown-preview ul,
        .markdown-preview ol {
          color: var(--reader-paper-text) !important;
        }
        .markdown-preview blockquote {
          background-color: var(--reader-code-bg) !important;
          color: var(--reader-paper-text) !important;
          border-left-color: #ff385c !important;
        }
        .markdown-preview pre {
          background-color: var(--reader-code-bg) !important;
          color: var(--reader-paper-text) !important;
        }
        .markdown-preview code {
          color: var(--reader-paper-fg) !important;
        }
        .markdown-preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.95em;
        }
        .markdown-preview th {
          border-bottom: 2.5px solid var(--reader-border) !important;
          padding: 10px 12px;
          font-weight: 600;
          text-align: left;
          color: var(--reader-paper-fg) !important;
        }
        .markdown-preview td {
          border-bottom: 1px solid var(--reader-border) !important;
          padding: 10px 12px;
          color: var(--reader-paper-text) !important;
        }
        .markdown-preview tr:hover {
          background-color: rgba(255, 56, 92, 0.02);
        }
        .markdown-preview input[type="checkbox"] {
          margin-right: 0.5rem;
          accent-color: #ff385c;
          cursor: not-allowed;
          width: 1rem;
          height: 1rem;
          vertical-align: middle;
        }
        .markdown-preview li {
          margin-bottom: 0.25rem;
        }
        .reader-themed-root,
        .reader-themed-header,
        .reader-themed-sidebar,
        .reader-themed-main,
        .reader-themed-paper,
        .reader-themed-sidebar-btn,
        .reader-themed-btn,
        .reader-themed-footer,
        .markdown-preview p,
        .markdown-preview h1,
        .markdown-preview h2,
        .markdown-preview h3,
        .markdown-preview h4,
        .markdown-preview h5,
        .markdown-preview h6,
        .markdown-preview blockquote,
        .markdown-preview pre {
          transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease;
        }
      `}</style>

      {/* 1. Header */}
      <header className={`reader-themed-header fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b px-4 backdrop-blur-md shrink-0 transition-transform duration-300 ease-in-out ${isScrollingDown ? "-translate-y-full pointer-events-none" : "translate-y-0"}`}>

        {/* Left Section: Back link & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link to={pageName ? `/reader/${docId}` : "/"} className="shrink-0">
            <Button variant="ghost" size="icon" className="reader-themed-btn h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="h-5 w-5 text-[#ff385c] shrink-0" />
            <h1 className="text-sm sm:text-base font-bold tracking-tight truncate">
              {bookTitle}
            </h1>
          </div>
        </div>

        {/* Right Section: Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0 ml-4 relative">
          {pageName && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-full transition-colors ${sidebarOpen ? "text-[#ff385c] bg-black/5 dark:bg-white/5" : "reader-themed-btn hover:bg-black/5 dark:hover:bg-white/5"}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title="Toggle Table of Contents"
              >
                <Menu className="h-4.5 w-4.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-full transition-colors ${showSettings ? "text-[#ff385c] bg-black/5 dark:bg-white/5" : "reader-themed-btn hover:bg-black/5 dark:hover:bg-white/5"}`}
                onClick={() => setShowSettings(!showSettings)}
                title="Formatting Settings"
              >
                <Type className="h-4.5 w-4.5" />
              </Button>
            </>
          )}



          {/* Settings Floating Panel */}
          {pageName && showSettings && (
            <div className="absolute right-0 top-14 w-80 sm:w-88 rounded-xl border p-5 shadow-2xl z-50 flex flex-col gap-5 text-left animate-in fade-in slide-in-from-top-2 duration-200 reader-themed-paper">
              <div className="flex items-center justify-between border-b reader-themed-border-divider pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider opacity-85">
                  Appearance Settings
                </span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Theme Selector */}
              <div>
                <span className="block text-[10px] opacity-60 mb-2 uppercase font-bold tracking-wider">Themes</span>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(READER_THEMES).map(([key, t]) => {
                    const isSelected = readerTheme === key
                    return (
                      <button
                        key={key}
                        onClick={() => setReaderTheme(key)}
                        style={{
                          backgroundColor: t.paperBg,
                          color: t.paperFg,
                          borderColor: isSelected ? "#ff385c" : t.border,
                        }}
                        className={`group relative flex flex-col items-center justify-center py-2 px-1 rounded-md border text-center transition-all ${isSelected
                          ? "ring-2 ring-[#ff385c]/35 border-[#ff385c]"
                          : "hover:scale-[1.02] hover:shadow-sm"
                          }`}
                        title={t.name}
                      >
                        {/* Theme text preview */}
                        <span className="text-[13px] font-serif font-bold mb-0.5" style={{ color: t.paperFg }}>Aa</span>
                        <span className="text-[9px] font-medium tracking-tight opacity-75 capitalize truncate w-full px-0.5" style={{ color: t.paperFg }}>
                          {t.name}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ff385c]" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Font Family */}
              <div>
                <span className="block text-[10px] opacity-60 mb-2 uppercase font-bold tracking-wider">Font Family</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "sans", label: "System Sans", previewStyle: { fontFamily: "system-ui" } },
                    { id: "serif", label: "Literary Serif", previewStyle: { fontFamily: "Georgia" } },
                    { id: "mono", label: "Developer Mono", previewStyle: { fontFamily: "monospace" } },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFontFamily(f.id as any)}
                      style={f.previewStyle}
                      className={`text-xs py-2 border rounded-lg font-medium transition-all ${fontFamily === f.id
                        ? "border-[#ff385c] text-[#ff385c] bg-black/[0.03] dark:bg-white/[0.03]"
                        : "reader-themed-border-divider hover:border-neutral-400 dark:hover:border-neutral-500 bg-transparent opacity-85"
                        }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <span className="block text-[10px] opacity-60 mb-2 uppercase font-bold tracking-wider">Font Size</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize((sz) => Math.max(12, sz - 1))}
                    className="flex-1 text-xs py-2 border rounded-lg hover:border-neutral-400 dark:hover:border-neutral-500 text-center font-bold reader-themed-border-divider transition-all"
                  >
                    A-
                  </button>
                  <div className="flex-[2] text-xs font-semibold py-2 border rounded-lg text-center reader-themed-border-divider select-none">
                    {fontSize}px
                  </div>
                  <button
                    onClick={() => setFontSize((sz) => Math.min(32, sz + 1))}
                    className="flex-1 text-xs py-2 border rounded-lg hover:border-neutral-400 dark:hover:border-neutral-500 text-center font-bold reader-themed-border-divider transition-all"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Line Height & Width Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Line Height */}
                <div>
                  <span className="block text-[10px] opacity-60 mb-1.5 uppercase font-bold tracking-wider">Line Spacing</span>
                  <div className="flex rounded-lg border reader-themed-border-divider p-0.5 gap-0.5">
                    {[
                      { id: "compact", label: "1.4" },
                      { id: "normal", label: "1.65" },
                      { id: "relaxed", label: "1.9" },
                    ].map((lh) => (
                      <button
                        key={lh.id}
                        onClick={() => setLineHeight(lh.id as any)}
                        className={`flex-1 text-[11px] py-1.5 rounded-md font-medium text-center transition-all ${lineHeight === lh.id
                          ? "bg-[#ff385c] text-white shadow-sm font-bold"
                          : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80"
                          }`}
                      >
                        {lh.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Width */}
                <div>
                  <span className="block text-[10px] opacity-60 mb-1.5 uppercase font-bold tracking-wider">Reading Width</span>
                  <div className="flex rounded-lg border reader-themed-border-divider p-0.5 gap-0.5">
                    {[
                      { id: "compact", label: "Slim" },
                      { id: "normal", label: "Mid" },
                      { id: "wide", label: "Wide" },
                    ].map((w) => (
                      <button
                        key={w.id}
                        onClick={() => setReaderWidth(w.id as any)}
                        className={`flex-1 text-[11px] py-1.5 rounded-md font-medium text-center transition-all ${readerWidth === w.id
                          ? "bg-[#ff385c] text-white shadow-sm font-bold"
                          : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80"
                          }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <span className="block text-[10px] opacity-60 mb-1.5 uppercase font-bold tracking-wider">Text Alignment</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "left", label: "Left Aligned", icon: AlignLeft },
                    { id: "justify", label: "Justified", icon: AlignJustify },
                  ].map((al) => {
                    const Icon = al.icon
                    const isSelected = alignment === al.id
                    return (
                      <button
                        key={al.id}
                        onClick={() => setAlignment(al.id as any)}
                        className={`flex items-center justify-center gap-2 text-xs py-2 border rounded-lg font-medium transition-all ${isSelected
                          ? "border-[#ff385c] text-[#ff385c] bg-black/[0.03] dark:bg-white/[0.03]"
                          : "reader-themed-border-divider hover:border-neutral-400 dark:hover:border-neutral-500 bg-transparent opacity-85"
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{al.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. Main Area */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Collapsible Left Sidebar: Chapters */}
        {pageName && (
          <aside className={`reader-themed-sidebar absolute inset-y-0 left-0 z-30 w-72 border-r flex flex-col md:relative pt-16 transition-all duration-300 ease-in-out ${sidebarOpen && !isScrollingDown ? "translate-x-0 md:ml-0 opacity-100" : "-translate-x-full md:-ml-72 opacity-0 pointer-events-none"}`}>
            <div className="flex items-center justify-between p-4 border-b reader-themed-border-divider">
              <span className="text-[11px] font-bold tracking-wider opacity-70 uppercase">
                Table of Contents
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="h-7 w-7 flex items-center justify-center rounded-full reader-themed-btn hover:bg-black/5 dark:hover:bg-white/5 md:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-neutral-400 text-xs">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading chapters...
                </div>
              ) : error ? (
                <div className="text-[#c13515] text-xs p-3">
                  Error loading list.
                </div>
              ) : (
                pages.map((p, idx) => {
                  const isActive = idx === currentPageIndex
                  return (
                    <button
                      key={p.filename}
                      onClick={() => {
                        navigate(`/reader/${docId}/${p.slug}`)
                        // Collapse sidebar on small screens after clicking
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false)
                        }
                        document.getElementById("reader-main")?.scrollTo({ top: 0 })
                      }}
                      className={`w-full flex items-start gap-3 rounded-md p-3 text-left text-sm border transition-all duration-200 ${isActive ? "reader-themed-sidebar-btn-active font-medium" : "reader-themed-sidebar-btn hover:bg-black/5 dark:hover:bg-white/5"}`}
                    >
                      <span className="text-[10px] font-mono font-bold opacity-50 mt-0.5 select-none w-5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 overflow-hidden">
                        <span className="truncate block font-medium">{p.title}</span>
                        <span className="text-[10px] opacity-60">
                          {p.wordCount.toLocaleString()} words
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Sidebar Footer */}
            {!loading && !error && pages.length > 0 && (
              <div className="reader-themed-footer border-t p-4 text-xs">
                <div className="flex justify-between mb-1">
                  <span>Total Words:</span>
                  <span className="font-semibold">{totalWords.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Progress:</span>
                  <span className="font-semibold">{Math.round(readProgress)}%</span>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Center Reader Content */}
        <main
          id="reader-main"
          onScroll={handleScroll}
          className="reader-themed-main flex-1 flex flex-col items-center overflow-y-auto pt-20 md:pt-24 pb-2 px-2 sm:pb-4 sm:px-4 md:pb-8 md:px-8 transition-all scroll-smooth"
        >
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-[#ff385c]" />
              <p className="text-sm font-medium">Preparing educational canvas...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center p-6 bg-white dark:bg-[#0a0a0a] border border-[#dddddd] dark:border-[#2c2c2c] rounded-md shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffd1da] text-[#c13515] mb-4">
                <BookOpen className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-[#222222] dark:text-white mb-2">Book Load Failed</h2>
              <p className="text-sm text-[#6a6a6a] dark:text-[#a3a3a3] mb-6">{error}</p>
              <Link to="/">
                <Button className="bg-[#ff385c] hover:bg-[#e00b41] text-white">
                  Back to Library
                </Button>
              </Link>
            </div>
          ) : !pageName ? (
            <div className="w-full max-w-4xl flex-1 flex flex-col relative transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Header / Hero Section */}
              <div className="text-center md:text-left mb-8 md:mb-12 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 border-b reader-themed-border-divider pb-6 md:pb-10 pt-2 md:pt-4">
                <div
                  className="w-40 h-40 md:w-48 md:h-48 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #ff385c 0%, #e00b41 100%)" }}
                >
                  <BookOpen className="h-12 w-12 md:h-16 md:w-16 mb-2 drop-shadow-md" />
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">DOCUMENT SET</span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2 mb-3 justify-center md:justify-start">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-[#ff385c]/10 text-[#ff385c]">
                      Published
                    </span>
                    <span className="text-xs opacity-60">·</span>
                    <span className="text-xs opacity-75 font-semibold">
                      {pages.length} Pages
                    </span>
                    <span className="text-xs opacity-60">·</span>
                    <span className="text-xs opacity-75 font-semibold">
                      {totalWords.toLocaleString()} Words
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                    {bookTitle}
                  </h2>
                  <p className="text-sm md:text-base opacity-75 leading-relaxed max-w-2xl mb-6">
                    Detailed documentation of Open Education Model, explaining each of it's pillars in details and discussing how it works and how to implement it in real life.
                  </p>
                  {pages.length > 0 && (
                    <div className="flex justify-center md:justify-start">
                      <Link to={`/reader/${docId}/${pages[0].slug}`}>
                        <Button className="bg-[#ff385c] hover:bg-[#e00b41] text-white rounded-full px-6 py-5 font-semibold text-sm shadow-md transition-all">
                          Start Reading
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Chapters list grid */}
              <div className="space-y-4 pb-12 px-2 sm:px-0">
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-70 mb-4 text-left">
                  Table of Contents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pages.map((p, idx) => {
                    const firstParagraph = p.content
                      .split("\n")
                      .map(line => line.trim())
                      .filter(line => line.length > 0 && !line.startsWith("#") && !line.startsWith(">"))
                      .find(line => line.length > 10) || "No description available."

                    const cleanDesc = firstParagraph.length > 120
                      ? firstParagraph.slice(0, 120) + "..."
                      : firstParagraph

                    return (
                      <Link
                        key={p.filename}
                        to={`/reader/${docId}/${p.slug}`}
                        className="group block"
                      >
                        <div className="reader-themed-paper border rounded-xl p-4 sm:p-5 h-full flex flex-col justify-between hover:border-[#ff385c] hover:shadow-md transition-all duration-200">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-mono font-bold opacity-45">
                                CHAPTER {String(idx + 1).padStart(2, "0")}
                              </span>
                              <span className="text-[10px] font-semibold opacity-60">
                                {p.wordCount.toLocaleString()} words
                              </span>
                            </div>
                            <h4 className="text-base font-bold tracking-tight mb-2 group-hover:text-[#ff385c] transition-colors text-left">
                              {p.title}
                            </h4>
                            <p className="text-xs opacity-75 leading-relaxed text-left line-clamp-2">
                              {cleanDesc}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t reader-themed-border-divider flex items-center justify-end text-xs font-bold text-[#ff385c] opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                            <span>Read Chapter →</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : currentPageIndex === -1 ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center p-6 bg-white dark:bg-[#0a0a0a] border border-[#dddddd] dark:border-[#2c2c2c] rounded-md shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffd1da] text-[#c13515] mb-4">
                <BookOpen className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-[#222222] dark:text-white mb-2">Page Not Found</h2>
              <p className="text-sm text-[#6a6a6a] dark:text-[#a3a3a3] mb-6">The requested page "{pageName}" could not be found.</p>
              <Link to={`/reader/${docId}`}>
                <Button className="bg-[#ff385c] hover:bg-[#e00b41] text-white">
                  Back to Table of Contents
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className={`w-full flex-1 flex flex-col items-center relative transition-all duration-300 ${getWidthClass()}`}>

                {/* Paper Canvas (Book Sheet) */}
                <div
                  className="reader-themed-paper relative w-full rounded-md border p-5 sm:p-8 md:p-12 flex-1 flex flex-col min-h-[400px] md:min-h-[500px] transition-all duration-300 select-text pb-24 mb-6"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {/* Visual Accent Corner Elements */}
                  <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-[#ff385c]/30 rounded-tl-md pointer-events-none" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#ff385c]/30 rounded-br-md pointer-events-none" />

                  <article
                    className="markdown-preview text-left flex-1 break-words prose dark:prose-invert max-w-none"
                    style={{
                      fontSize: "inherit",
                      ...getFontFamilyStyle(),
                      ...getLineHeightStyle(),
                      textAlign: alignment === "justify" ? "justify" : "left",
                    }}
                  >
                    <MarkdownRenderer 
                      content={activePage ? activePage.content : ""} 
                      isDark={activeTheme.isDark} 
                    />
                  </article>

                  {/* Sub-status Indicator */}
                  <div className="mt-8 pt-4 border-t reader-themed-border-divider flex items-center justify-between text-xs opacity-60 select-none pointer-events-none">
                    <span>{activePage ? activePage.wordCount.toLocaleString() : 0} words</span>
                    <span>Chapter {currentPageIndex + 1} of {pages.length}</span>
                  </div>
                </div>
              </div>

              {/* Sticky Fixed Bottom Navigation Controls */}
              <div
                className={`sticky bottom-0 mt-8 w-full max-w-2xl z-40 transition-all duration-300 ease-in-out px-2 sm:px-0
                  ${isScrollingDown ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}
              >
                <div className="reader-themed-paper flex items-center justify-between gap-4 p-3 rounded-full border shadow-lg backdrop-blur-md">

                  {/* Previous Button */}
                  <Button
                    onClick={() => {
                      const prevIdx = Math.max(0, currentPageIndex - 1)
                      const prevPage = pages[prevIdx]
                      if (prevPage) {
                        navigate(`/reader/${docId}/${prevPage.slug}`)
                        document.getElementById("reader-main")?.scrollTo({ top: 0, behavior: "smooth" })
                      }
                    }}
                    disabled={currentPageIndex === 0}
                    variant="ghost"
                    className="flex items-center gap-1.5 h-10 rounded-full reader-themed-btn hover:bg-black/5 dark:hover:bg-white/5 font-semibold border-none px-4 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                    <span className="hidden sm:inline text-xs uppercase tracking-wider font-bold">Previous</span>
                  </Button>

                  {/* Central progress visual indicator */}
                  <div className="flex-1 flex flex-col items-center max-w-[120px] sm:max-w-xs">
                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider mb-1.5">
                      {currentPageIndex + 1} / {pages.length} Pages
                    </span>
                    <div className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ff385c] rounded-full transition-all duration-300"
                        style={{ width: `${readProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Next/Finish Button */}
                  {currentPageIndex === pages.length - 1 ? (
                    <Link to="/">
                      <Button
                        className="flex items-center gap-1.5 h-10 rounded-full bg-[#ff385c] hover:bg-[#e00b41] px-5 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-[0_2px_4px_rgba(255,56,92,0.2)]"
                      >
                        <BookmarkCheck className="h-4 w-4" />
                        <span>Finish</span>
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => {
                        const nextIdx = Math.min(pages.length - 1, currentPageIndex + 1)
                        const nextPage = pages[nextIdx]
                        if (nextPage) {
                          navigate(`/reader/${docId}/${nextPage.slug}`)
                          document.getElementById("reader-main")?.scrollTo({ top: 0, behavior: "smooth" })
                        }
                      }}
                      variant="ghost"
                      className="flex items-center gap-1.5 h-10 rounded-full reader-themed-btn hover:bg-black/5 dark:hover:bg-white/5 font-semibold border-none px-4 transition-all"
                    >
                      <span className="hidden sm:inline text-xs uppercase tracking-wider font-bold">Next</span>
                      <ChevronRight className="h-4.5 w-4.5" />
                    </Button>
                  )}

                </div>
              </div>
            </>
          )}
        </main>

      </div>

    </div>
  )
}

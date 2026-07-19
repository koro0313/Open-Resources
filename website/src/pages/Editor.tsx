import { useState, useRef } from "react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import MarkdownRenderer from "@/components/MarkdownRenderer"
import {
  ArrowLeft,
  Save,
  Eye,
  BookOpen,
  FileText,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight
} from "lucide-react"

interface Page {
  id: string;
  title: string;
  content: string;
  starred?: boolean;
}



export default function Editor() {
  const { theme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const [pages, setPages] = useState<Page[]>([
    {
      id: "1",
      title: "Untitled Page",
      content: "",
      starred: false
    }
  ]);

  const [bookTitle, setBookTitle] = useState<string>("Untitled Book");
  const [selectedPageId, setSelectedPageId] = useState<string>("1");
  const [deletedPages, setDeletedPages] = useState<Page[]>([]);
  const [editorMode, setEditorMode] = useState<"edit" | "preview" | "split">("edit");
  const [fontFamily, setFontFamily] = useState<string>("Inter Variable");
  const [lineHeight, setLineHeight] = useState<string>("1.5");

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (isSyncingRef.current) return;
    const preview = previewRef.current;
    if (!preview) return;
    isSyncingRef.current = true;
    const editor = e.currentTarget;
    const percentage = editor.scrollHeight - editor.clientHeight > 0
      ? editor.scrollTop / (editor.scrollHeight - editor.clientHeight)
      : 0;
    preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  };

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingRef.current) return;
    const editor = editorRef.current;
    if (!editor) return;
    isSyncingRef.current = true;
    const preview = e.currentTarget;
    const percentage = preview.scrollHeight - preview.clientHeight > 0
      ? preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
      : 0;
    editor.scrollTop = percentage * (editor.scrollHeight - editor.clientHeight);
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  };

  const activePage = pages.find((p) => p.id === selectedPageId) || pages[0] || { id: "", title: "", content: "", starred: false };

  const handleTitleChange = (newTitle: string) => {
    setPages(pages.map((p) => (p.id === selectedPageId ? { ...p, title: newTitle } : p)));
  };

  const handleContentChange = (newContent: string) => {
    setPages(pages.map((p) => (p.id === selectedPageId ? { ...p, content: newContent } : p)));
  };

  const handleAddPage = () => {
    const newId = String(Date.now());
    const newPage: Page = {
      id: newId,
      title: `Untitled Page`,
      content: "",
      starred: false
    };
    setPages([...pages, newPage]);
    setSelectedPageId(newId);
  };

  const handleDeletePage = (id: string) => {
    const pageToDelete = pages.find((p) => p.id === id);
    if (!pageToDelete) return;

    const updatedPages = pages.filter((p) => p.id !== id);
    setPages(updatedPages);
    setDeletedPages([...deletedPages, pageToDelete]);

    if (selectedPageId === id) {
      if (updatedPages.length > 0) {
        setSelectedPageId(updatedPages[0].id);
      } else {
        const fallbackId = String(Date.now());
        const fallbackPage: Page = {
          id: fallbackId,
          title: "Untitled Page",
          content: "",
          starred: false
        };
        setPages([fallbackPage]);
        setSelectedPageId(fallbackId);
      }
    }
  };

  const handleRestorePage = (id: string) => {
    const pageToRestore = deletedPages.find((p) => p.id === id);
    if (!pageToRestore) return;
    setDeletedPages(deletedPages.filter((p) => p.id !== id));
    setPages([...pages, pageToRestore]);
    setSelectedPageId(id);
  };

  const handleInsertMarkdown = (before: string, after: string = "") => {
    const textarea = document.getElementById("editor-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = before + selectedText + after;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      const newContent = text.substring(0, start) + "  " + text.substring(end);
      handleContentChange(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const applyFormat = (type: string) => {
    switch (type) {
      case "bold":
        handleInsertMarkdown("**", "**");
        break;
      case "italic":
        handleInsertMarkdown("*", "*");
        break;
      case "underline":
        handleInsertMarkdown("<u>", "</u>");
        break;
      case "heading1":
        handleInsertMarkdown("# ", "");
        break;
      case "heading2":
        handleInsertMarkdown("## ", "");
        break;
      case "alignLeft":
        handleInsertMarkdown("<div align=\"left\">", "</div>");
        break;
      case "alignCenter":
        handleInsertMarkdown("<div align=\"center\">", "</div>");
        break;
      case "alignRight":
        handleInsertMarkdown("<div align=\"right\">", "</div>");
        break;
      default:
        break;
    }
  };

  // Word count & stat calculations
  const totalWords = pages.reduce((sum, p) => {
    const wc = p.content.trim()
      ? p.content.trim().split(/\s+/).filter(Boolean).length
      : 0;
    return sum + wc;
  }, 0);

  const activePageWordCount = activePage.content.trim()
    ? activePage.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const activePageCharCount = activePage.content.length;
  const readTime = Math.max(1, Math.ceil(activePageWordCount / 200));

  // Determine classes for textarea styling
  const getEditorStyles = () => {
    let fontClass = "font-sans";
    if (fontFamily === "Merriweather (Serif)") fontClass = "font-serif";
    if (fontFamily === "Fira Code (Monospace)") fontClass = "font-mono text-sm";

    let lhClass = "leading-relaxed";
    if (lineHeight === "1.25") lhClass = "leading-snug";
    if (lineHeight === "1.75") lhClass = "leading-loose";

    return `${fontClass} ${lhClass}`;
  };

  return (
    <div className="flex h-svh flex-col bg-[#f7f7f7] text-[#222222] font-sans selection:bg-[#ff385c] selection:text-white dark:bg-[#0a0a0a] dark:text-[#f5f5f5] transition-colors duration-300">
      
      {/* Clean Top Navbar */}
      <header className="relative flex h-20 items-center justify-between border-b border-[#dddddd] bg-white px-6 dark:border-[#2c2c2c] dark:bg-[#0a0a0a] shrink-0">
        
        {/* Exit Button */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-[#f7f7f7] dark:hover:bg-[#121212] text-[#222222] dark:text-[#f5f5f5]">
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#ff385c]" />
            <span className="text-sm font-bold tracking-tight text-[#ff385c] hidden sm:inline">OpenBooks Workspace</span>
          </div>
        </div>

        {/* Book Title Input Centered */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <input
            type="text"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="Untitled Book"
            className="bg-transparent text-sm font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#ff385c] px-1.5 py-0.5 transition-all w-36 text-center"
          />
        </div>

        {/* Toolbar / Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-full hover:bg-[#f7f7f7] dark:hover:bg-[#121212] ${editorMode === "preview" ? "text-[#ff385c] bg-[#f7f7f7] dark:bg-[#121212]" : ""}`}
            onClick={() => setEditorMode(editorMode === "preview" ? "edit" : "preview")}
            title="Toggle Preview Mode"
          >
            <Eye className="h-4.5 w-4.5" />
          </Button>

          <Button className="h-9 rounded-lg bg-[#ff385c] hover:bg-[#e00b41] px-4 text-xs font-bold uppercase tracking-[0.7px] text-white transition-all shadow-[0_2px_4px_rgba(255,56,92,0.2)]">
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar - Pages List & Formatting Preferences */}
        <aside className="hidden w-64 flex-col border-r border-[#dddddd] bg-white dark:border-[#2c2c2c] dark:bg-[#0a0a0a] lg:flex shrink-0">
          <div className="flex items-center justify-between p-4 pb-2">
            <span className="text-[11px] font-bold tracking-wider text-[#6a6a6a] dark:text-[#a3a3a3] uppercase">Pages</span>
            <button
              onClick={handleAddPage}
              className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-[#f7f7f7] dark:hover:bg-[#121212] text-[#222222] dark:text-white transition-colors"
              title="Add Page"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {pages.map((p, index) => {
              const isActive = p.id === selectedPageId;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPageId(p.id)}
                  className={`group flex items-center justify-between rounded-md p-2.5 text-sm cursor-pointer border transition-all duration-200 ${isActive
                      ? "bg-[#f7f7f7] border-[#dddddd] font-medium text-[#222222] dark:bg-[#121212] dark:border-[#2c2c2c] dark:text-white"
                      : "border-transparent text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222] dark:hover:bg-[#121212] dark:hover:text-white"
                    }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-600 w-5 shrink-0 select-none">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <FileText className={`h-4 w-4 shrink-0 ${isActive ? "text-[#ff385c]" : ""}`} />
                    <span className="truncate">{p.title || "Untitled Page"}</span>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(p.id);
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-[#ff385c] transition-colors"
                      title="Delete Page"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deleted Pages List */}
          {deletedPages.length > 0 && (
            <div className="border-t border-[#dddddd] p-4 dark:border-[#2c2c2c] max-h-48 overflow-y-auto bg-[#f7f7f7] dark:bg-[#121212] shrink-0">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-[#6a6a6a] dark:text-[#a3a3a3] uppercase mb-2">
                <span>Trash Bin</span>
                <button
                  type="button"
                  onClick={() => setDeletedPages([])}
                  title="Empty Trash"
                  className="cursor-pointer text-inherit hover:text-[#ff385c] transition-colors bg-transparent border-0 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1.5">
                {deletedPages.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded p-1.5 text-xs text-neutral-500 bg-white dark:bg-[#0a0a0a] border border-neutral-100 dark:border-neutral-900">
                    <span className="truncate max-w-[120px]">{p.title || "Untitled Page"}</span>
                    <button
                      onClick={() => handleRestorePage(p.id)}
                      className="text-[#ff385c] hover:underline font-bold text-[10px] uppercase"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formatting Preferences relocated at bottom of Left Sidebar */}
          <div className="border-t border-[#dddddd] dark:border-[#2c2c2c] p-4 bg-white dark:bg-[#0a0a0a] text-left shrink-0">
            <span className="text-[10px] font-bold tracking-wider text-[#6a6a6a] dark:text-[#a3a3a3] uppercase block mb-3">Formatting</span>
            <div className="space-y-3">
              <div>
                <span className="block text-[10px] text-neutral-500 mb-1">Editor Font</span>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full rounded-md border border-[#dddddd] dark:border-[#2c2c2c] p-1.5 text-xs bg-transparent dark:bg-[#121212] focus:outline-none focus:border-[#ff385c] text-[#222222] dark:text-white"
                >
                  <option value="Inter Variable">Inter Variable (Sans)</option>
                  <option value="Merriweather (Serif)">Merriweather (Serif)</option>
                  <option value="Fira Code (Monospace)">Fira Code (Mono)</option>
                </select>
              </div>
              <div>
                <span className="block text-[10px] text-neutral-500 mb-1">Line Height</span>
                <div className="flex gap-1">
                  {["1.25", "1.5", "1.75"].map(lh => (
                    <button
                      key={lh}
                      className={`flex-1 text-xs py-1 h-7 border rounded transition-all font-semibold ${lineHeight === lh ? "border-[#ff385c] text-[#ff385c] bg-[#f7f7f7] dark:bg-[#121212]" : "border-[#dddddd] dark:border-[#2c2c2c] hover:border-neutral-500 text-neutral-600 dark:text-neutral-400"}`}
                      onClick={() => setLineHeight(lh)}
                    >
                      {lh}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Editor Canvas */}
        <main className="flex flex-1 flex-col items-center overflow-y-auto p-4 md:p-8 bg-[#f7f7f7] dark:bg-[#121212]">
          
          {/* Format Toolbar */}
          <div className="mb-6 flex flex-wrap items-center gap-1 rounded-full border border-[#dddddd] bg-white p-1.5 shadow-sm dark:border-[#2c2c2c] dark:bg-[#0a0a0a] transition-all">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#f7f7f7] dark:hover:bg-[#121212] text-[#222222] dark:text-white"
              onClick={() => applyFormat("bold")}
              disabled={editorMode === "preview"}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#f7f7f7] dark:hover:bg-[#121212] text-[#222222] dark:text-white"
              onClick={() => applyFormat("italic")}
              disabled={editorMode === "preview"}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#f7f7f7] dark:hover:bg-[#121212] text-[#222222] dark:text-white"
              onClick={() => applyFormat("underline")}
              disabled={editorMode === "preview"}
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </Button>

            <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#f7f7f7] dark:hover:bg-[#121212] text-[#222222] dark:text-white font-bold"
              onClick={() => applyFormat("heading1")}
              disabled={editorMode === "preview"}
              title="H1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#f7f7f7] dark:hover:bg-[#121212] text-[#222222] dark:text-white font-bold"
              onClick={() => applyFormat("heading2")}
              disabled={editorMode === "preview"}
              title="H2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>

            <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#f7f7f7] dark:hover:bg-[#121212] text-[#222222] dark:text-white"
              onClick={() => applyFormat("alignLeft")}
              disabled={editorMode === "preview"}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#f7f7f7] dark:hover:bg-[#121212] text-[#222222] dark:text-white"
              onClick={() => applyFormat("alignCenter")}
              disabled={editorMode === "preview"}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#f7f7f7] dark:hover:bg-[#121212] text-[#222222] dark:text-white"
              onClick={() => applyFormat("alignRight")}
              disabled={editorMode === "preview"}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>

            <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

            {/* View Mode Selector */}
            <div className="flex gap-0.5 bg-[#f7f7f7] dark:bg-[#121212] rounded-full p-0.5 ml-1">
              <button
                className={`h-7 px-3 text-xs rounded-full font-bold uppercase tracking-wider transition-all ${editorMode === "edit" ? "bg-white text-[#ff385c] shadow-sm dark:bg-[#0a0a0a]" : "text-[#6a6a6a] dark:text-[#a3a3a3] hover:text-[#222222]"}`}
                onClick={() => setEditorMode("edit")}
              >
                Write
              </button>
              <button
                className={`h-7 px-3 text-xs rounded-full font-bold uppercase tracking-wider transition-all ${editorMode === "preview" ? "bg-white text-[#ff385c] shadow-sm dark:bg-[#0a0a0a]" : "text-[#6a6a6a] dark:text-[#a3a3a3] hover:text-[#222222]"}`}
                onClick={() => setEditorMode("preview")}
              >
                Preview
              </button>
              <button
                className={`h-7 px-3 text-xs rounded-full font-bold uppercase tracking-wider transition-all hidden md:inline-block ${editorMode === "split" ? "bg-white text-[#ff385c] shadow-sm dark:bg-[#0a0a0a]" : "text-[#6a6a6a] dark:text-[#a3a3a3] hover:text-[#222222]"}`}
                onClick={() => setEditorMode("split")}
              >
                Split
              </button>
            </div>
          </div>

          {/* The Paper Canvas */}
          <div className={`relative w-full rounded-md border border-[#dddddd] bg-white p-6 shadow-sm dark:border-[#2c2c2c] dark:bg-[#0a0a0a] md:p-10 flex-1 flex flex-col min-h-[500px] transition-all duration-300 ${editorMode === "split" ? "max-w-5xl" : "max-w-2xl"
            }`}>
            
            {/* Visual Accent Corner Elements */}
            <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-[#ff385c]/30" />
            <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#ff385c]/30" />

            {editorMode === "split" ? (
              <div className="flex flex-1 gap-8 overflow-hidden">
                {/* Edit Pane */}
                <div className="flex-1 flex flex-col gap-4">
                  <input
                    type="text"
                    value={activePage.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full bg-transparent text-[22px] font-medium tracking-tight text-[#222222] dark:text-white focus:outline-none border-b border-[#dddddd] dark:border-[#2c2c2c] pb-2 font-sans"
                    placeholder="Untitled Page"
                  />
                  <textarea
                    id="editor-textarea"
                    ref={editorRef}
                    onScroll={handleEditorScroll}
                    value={activePage.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`w-full flex-1 resize-none bg-transparent focus:outline-none text-[#3f3f3f] dark:text-[#d4d4d4] ${getEditorStyles()}`}
                    placeholder="Start writing in Markdown..."
                  />
                </div>

                {/* Vertical Hairline Divider */}
                <div className="w-px bg-[#dddddd] dark:bg-[#2c2c2c] self-stretch" />

                {/* Preview Pane */}
                <div
                  ref={previewRef}
                  onScroll={handlePreviewScroll}
                  className="flex-1 overflow-y-auto text-left flex flex-col gap-4"
                >
                  <h1 className="text-[22px] font-medium tracking-tight text-[#222222] dark:text-white border-b border-[#ebebeb] dark:border-[#2c2c2c] pb-2">
                    {activePage.title || "Untitled Page"}
                  </h1>
                  <MarkdownRenderer 
                    content={activePage.content} 
                    isDark={isDark} 
                    className="markdown-preview text-base leading-relaxed flex-1"
                  />
                </div>
              </div>
            ) : editorMode === "preview" ? (
              <div className="flex-1 overflow-y-auto text-left flex flex-col gap-4">
                <h1 className="text-[22px] font-medium tracking-tight text-[#222222] dark:text-white border-b border-[#ebebeb] dark:border-[#2c2c2c] pb-2">
                  {activePage.title || "Untitled Page"}
                </h1>
                <MarkdownRenderer 
                  content={activePage.content} 
                  isDark={isDark} 
                  className="markdown-preview text-base leading-relaxed flex-1"
                />
              </div>
            ) : (
              // Write mode
              <div className="flex-1 flex flex-col gap-4">
                <input
                  type="text"
                  value={activePage.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-transparent text-[22px] font-medium tracking-tight text-[#222222] dark:text-white focus:outline-none border-b border-[#dddddd] dark:border-[#2c2c2c] pb-2 font-sans"
                  placeholder="Untitled Page"
                />
                <textarea
                  id="editor-textarea"
                  value={activePage.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full flex-1 resize-none bg-transparent focus:outline-none text-[#3f3f3f] dark:text-[#d4d4d4] ${getEditorStyles()}`}
                  placeholder="Start writing in Markdown..."
                />
              </div>
            )}

            {/* Premium, Minimalist Status Bar */}
            <div className="mt-6 pt-4 border-t border-[#ebebeb] dark:border-[#1e1e1e] flex flex-wrap items-center justify-between text-xs text-[#6a6a6a] dark:text-[#a3a3a3] select-none">
              <div className="flex items-center gap-3">
                <span><strong>Page:</strong> {activePageWordCount} words</span>
                <span>·</span>
                <span>{activePageCharCount} chars</span>
                <span>·</span>
                <span>{readTime} min read</span>
              </div>
              <div>
                <span><strong>Book Total:</strong> {totalWords.toLocaleString()} words</span>
              </div>
            </div>

          </div>
        </main>

      </div>

    </div>
  )
}

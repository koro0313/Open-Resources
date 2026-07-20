import { useState } from "react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { BookOpen, Search } from "lucide-react"

interface Book {
  id: string;
  title: string;
  author: string;
  words: string;
  chapters: string;
  genre: string;
  status: string;
  image: string;
}

export default function Landing() {
  const [books] = useState<Book[]>([
    {
      id: "open-education-docs",
      title: "Open Education Docs",
      author: "Open Community",
      words: "0 words",
      chapters: "8 pages",
      genre: "Education",
      status: "Published",
      image: "linear-gradient(135deg, #ff385c 0%, #e00b41 100%)"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = books.filter(b => {
    const query = searchQuery.toLowerCase();
    return b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-svh bg-white text-[#222222] font-sans selection:bg-[#ff385c] selection:text-white dark:bg-[#0a0a0a] dark:text-[#f5f5f5] transition-colors duration-300 flex flex-col">
      
      {/* 1. Minimal Header */}
      <nav className="sticky top-0 z-50 h-20 border-b border-[#dddddd] bg-white px-6 md:px-12 flex items-center justify-between dark:border-[#2c2c2c] dark:bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff385c] text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#ff385c]">
            Open Resources
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/reader/open-education-docs">
            <Button variant="ghost" className="h-10 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-[#f7f7f7] dark:hover:bg-[#121212] px-4 text-sm font-semibold transition-all">
              Read Docs
            </Button>
          </Link>
          <Link to="/editor">
            <Button className="h-10 rounded-lg bg-[#ff385c] hover:bg-[#e00b41] px-5 text-sm font-semibold text-white transition-all shadow-[0_2px_4px_rgba(255,56,92,0.2)]">
              Open Workspace
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero & Search Section */}
      <header className="max-w-[1280px] mx-auto px-6 md:px-12 pt-12 pb-16 text-center flex-1 w-full">
        <h1 className="text-3xl md:text-[28px] font-bold tracking-tight text-[#222222] dark:text-white mb-8">
          Inspiration for future masterpieces.
        </h1>

        {/* Clean & Simple Search Bar */}
        <div className="max-w-md mx-auto mb-16 relative">
          <div className="flex h-12 w-full items-center rounded-full border border-[#dddddd] bg-white shadow-sm dark:border-[#2c2c2c] dark:bg-[#121212] transition-all p-1 focus-within:border-[#ff385c] focus-within:ring-1 focus-within:ring-[#ff385c]/50">
            <Search className="h-4 w-4 text-[#6a6a6a] dark:text-[#a3a3a3] ml-4 shrink-0" />
            <input 
              type="text" 
              placeholder="Search drafts by title or author..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm text-[#222222] dark:text-white bg-transparent outline-none w-full border-none px-3 focus:ring-0 placeholder:text-[#929292]"
            />
          </div>
        </div>

        {/* Book Cards Grid */}
        <section className="text-left">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-[#222222] dark:text-white">
              Recent Masterpieces
            </h2>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#dddddd] dark:border-[#2c2c2c] rounded-xl bg-[#f7f7f7] dark:bg-[#121212]">
              <BookOpen className="h-12 w-12 mx-auto text-[#6a6a6a] dark:text-[#a3a3a3] mb-4 opacity-50" />
              <p className="text-[#6a6a6a] dark:text-[#a3a3a3] text-sm">No book drafts matched your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <Link
                  to={book.status === "Published" ? `/reader/${book.id}` : "/editor"}
                  key={book.id}
                  className="group flex flex-col"
                >
                  
                  {/* Card Simulation */}
                  <div className="relative aspect-square w-full rounded-md overflow-hidden bg-[#f2f2f2] dark:bg-[#121212] transition-all duration-200 group-hover:shadow-md border border-neutral-100 dark:border-neutral-900/40">
                    <div 
                      className="absolute inset-0 flex items-center justify-center p-6 text-white text-center flex-col gap-2"
                      style={{ background: book.image }}
                    >
                      <BookOpen className="h-10 w-10 opacity-90 drop-shadow-md" />
                      <h3 className="font-semibold text-base line-clamp-2 px-4 leading-tight drop-shadow-md">
                        {book.title}
                      </h3>
                      <p className="text-[10px] uppercase font-bold tracking-wider opacity-85 drop-shadow-sm">
                        {book.genre}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 bg-white/95 dark:bg-[#1e1e1e]/95 text-[#222222] dark:text-white px-2.5 py-1 text-[10px] font-semibold rounded-full shadow-sm uppercase tracking-wider">
                      {book.status}
                    </div>
                  </div>

                  {/* Metadata block */}
                  <div className="mt-3 flex flex-col text-left">
                    <h4 className="text-sm font-semibold text-[#222222] dark:text-white truncate">
                      {book.title}
                    </h4>
                    <span className="text-xs text-[#6a6a6a] dark:text-[#a3a3a3] mt-0.5">
                      By {book.author} · {book.words}
                    </span>
                    <span className="text-xs text-[#6a6a6a] dark:text-[#a3a3a3]">
                      {book.chapters}
                    </span>
                  </div>

                </Link>
              ))}
            </div>
          )}
        </section>
      </header>

      {/* Minimal Footer */}
      <footer className="border-t border-[#dddddd] dark:border-[#2c2c2c] bg-white dark:bg-[#0a0a0a] py-8 text-center text-xs text-[#6a6a6a] dark:text-[#a3a3a3] transition-colors shrink-0">
        <p>© 2026 Open Resources. A clean, distraction-free writing space.</p>
      </footer>

    </div>
  )
}

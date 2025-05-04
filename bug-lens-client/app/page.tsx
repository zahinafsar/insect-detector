import InsectDetector from "@/components/insect-detector"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 text-center">
            <div className="inline-block mb-2">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                  BugLens
                </span>
              </h1>
            </div>
            <div className="flex items-center justify-center gap-1 mb-4">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-emerald-500"></div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 px-2">AI-POWERED</p>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-emerald-500"></div>
            </div>
            <p className="text-emerald-700 dark:text-emerald-400 max-w-2xl mx-auto text-lg">
              Upload or capture an image of an insect and our AI will identify it for you
            </p>
          </header>
          <InsectDetector />
        </div>
      </main>
    </ThemeProvider>
  )
}

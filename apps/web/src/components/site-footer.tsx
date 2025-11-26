import { Gamepad2 } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0 bg-background/50">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Gamepad2 className="h-6 w-6" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <a href="#" className="font-medium underline underline-offset-4">
              v0
            </a>
            . Powered by Next.js and Vercel.
          </p>
        </div>
        <div className="flex gap-4">
          <p className="text-sm text-muted-foreground">Version 1.0.0</p>
        </div>
      </div>
    </footer>
  )
}

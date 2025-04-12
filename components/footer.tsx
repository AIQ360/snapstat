import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className=" flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SaaS Boilerplate. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}

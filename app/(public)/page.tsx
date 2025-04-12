import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">SnapStats</h1>
              <p className="text-xl font-medium">Beautiful Analytics for Indie Hackers</p>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Transform your Google Analytics data into clean, beautiful, and social-media-ready visuals. Perfect for
                indie hackers and small startups.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/sign-up">
                <Button size="lg" className="gap-1">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Key Features</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Everything you need to showcase your website's growth
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
            {[
              {
                title: "Screenshot-Ready Stats",
                description: "Clean, chart-based UI made for screenshotting and sharing on social media",
              },
              {
                title: "Indie Timeline View",
                description: "A personal analytics dashboard that feels indie, not corporate",
              },
              {
                title: "Active Timeline Events",
                description: "Automatically detect and highlight traffic spikes, drops, and growth streaks",
              },
              {
                title: "No Code Installation",
                description: "Connect directly to Google Analytics - no need to add code to your site",
              },
              {
                title: "Privacy-Friendly",
                description: "We only store aggregated stats, never personal or identifiable information",
              },
              {
                title: "Indie-Friendly Design",
                description: "Clean visuals that evoke confidence and transparency",
              },
            ].map((feature, index) => (
              <div key={index} className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                <div className="rounded-full bg-primary p-2">
                  <Check className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">How It Works</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Get started in just a few simple steps
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
            {[
              {
                title: "1. Connect Google Analytics",
                description: "Authorize SnapStats to access your Google Analytics data",
              },
              {
                title: "2. Select Your Website",
                description: "Choose which website you want to visualize",
              },
              {
                title: "3. Share Your Growth",
                description: "Generate beautiful screenshots and share them on social media",
              },
            ].map((step, index) => (
              <div key={index} className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                <div className="rounded-full bg-primary p-2">
                  <span className="text-lg font-bold text-primary-foreground">{index + 1}</span>
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to Showcase Your Growth?</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Sign up now and start creating beautiful analytics visualizations for your website.
              </p>
            </div>
            <Link href="/sign-up">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

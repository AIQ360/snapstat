import type React from "react"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

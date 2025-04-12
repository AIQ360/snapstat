import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TopPage {
  page_path: string
  page_views: number
}

interface TopPagesTableProps {
  pages: TopPage[]
}

export function TopPagesTable({ pages }: TopPagesTableProps) {
  const total = pages.reduce((sum, page) => sum + page.page_views, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Pages</CardTitle>
        <CardDescription>Your most viewed pages</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.page_path}>
                <TableCell className="font-medium">
                  {page.page_path.length > 30 ? `${page.page_path.substring(0, 30)}...` : page.page_path}
                </TableCell>
                <TableCell className="text-right">{page.page_views}</TableCell>
                <TableCell className="text-right">
                  {total > 0 ? `${Math.round((page.page_views / total) * 100)}%` : "0%"}
                </TableCell>
              </TableRow>
            ))}
            {pages.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No page data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Referrer {
  source: string
  visitors: number
}

interface ReferrersTableProps {
  referrers: Referrer[]
}

export function ReferrersTable({ referrers }: ReferrersTableProps) {
  const total = referrers.reduce((sum, ref) => sum + ref.visitors, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Referrers</CardTitle>
        <CardDescription>Where your visitors are coming from</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Visitors</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {referrers.map((referrer) => (
              <TableRow key={referrer.source}>
                <TableCell className="font-medium">{referrer.source}</TableCell>
                <TableCell className="text-right">{referrer.visitors}</TableCell>
                <TableCell className="text-right">
                  {total > 0 ? `${Math.round((referrer.visitors / total) * 100)}%` : "0%"}
                </TableCell>
              </TableRow>
            ))}
            {referrers.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No referrer data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

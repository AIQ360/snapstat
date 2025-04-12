import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Event {
  id: string
  date: string
  event_type: "spike" | "drop" | "milestone" | "streak"
  title: string
  description: string
  value: number
}

interface EventsTimelineProps {
  events: Event[]
}

export function EventsTimeline({ events }: EventsTimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "spike":
        return "📈"
      case "drop":
        return "📉"
      case "milestone":
        return "🏆"
      case "streak":
        return "🔥"
      default:
        return "📊"
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "spike":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "drop":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "milestone":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "streak":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indie Signals</CardTitle>
        <CardDescription>Notable events from your analytics</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground">No events detected yet. Keep growing your site!</div>
        ) : (
          <div className="space-y-8">
            {events.map((event) => (
              <div key={event.id} className="relative pl-8">
                <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <span>{getEventIcon(event.event_type)}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{event.title}</h4>
                    <Badge variant="outline" className={getEventColor(event.event_type)}>
                      {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(event.date), "MMMM d, yyyy")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

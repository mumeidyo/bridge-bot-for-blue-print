import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Link as LinkIcon, AlertCircle } from "lucide-react";
import type { Bridge, Log } from "@shared/schema";

export default function Dashboard() {
  const { data: bridges = [] } = useQuery<Bridge[]>({
    queryKey: ["/api/bridges"],
  });

  const { data: logs = [] } = useQuery<Log[]>({
    queryKey: ["/api/logs"],
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const showError = !settings?.discordToken || !settings?.revoltToken;

  return (
    <div className="space-y-4">
      {showError && (
        <Card className="border-destructive">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Configuration Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Bot tokens not configured. Please configure them in the settings page.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Active Bridges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bridges.length === 0 ? (
                <p className="text-muted-foreground text-sm">No bridges configured yet.</p>
              ) : (
                bridges.map((bridge) => (
                  <div key={bridge.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {bridge.discordChannelId} → {bridge.revoltChannelId}
                      </span>
                    </div>
                    <Badge variant={bridge.enabled ? "default" : "secondary"}>
                      {bridge.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No logs available.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-2 border rounded text-sm">
                      <div className="flex items-center justify-between">
                        <Badge variant={log.level === "error" ? "destructive" : "secondary"}>
                          {log.level}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1">{log.message}</p>
                      {log.metadata && (
                        <pre className="mt-1 text-xs bg-muted p-1 rounded">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
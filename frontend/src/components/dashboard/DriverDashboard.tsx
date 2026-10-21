"use client";

import { useEffect, useState } from "react";
import { Bus, MapPin, Users, Clock, Inbox } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, Skeleton } from "@/components/ui";
import { getMyDriver, type DriverPortal } from "@/lib/api/portal";

export function DriverDashboard() {
  const [data, setData] = useState<DriverPortal | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getMyDriver()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, []);

  if (data === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  const routes = data?.routes ?? [];

  return (
    <div className="flex flex-col gap-5">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Bus className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-text">My routes</h2>
          {routes.length > 0 && <span className="text-xs text-muted">· {routes.length}</span>}
        </div>

        {routes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-surface-hover text-subtle">
                <Bus className="size-5" />
              </div>
              <p className="text-sm font-medium text-text">No route assigned to you yet</p>
              <p className="max-w-md text-xs text-muted">
                Your bus route and student pickup list appear here once the office assigns a route to your
                name. Please contact the transport in-charge if this looks wrong.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {routes.map((r) => (
              <Card key={r.id} className="card-hover">
                <CardHeader>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-text">{r.name}</h3>
                      <Badge variant="outline">{r.code}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{r.bus ? `Bus ${r.bus}` : "Bus —"}</p>
                  </div>
                  <Badge variant={r.status === "active" ? "success" : "default"}>{r.status}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-surface-sunken px-3 py-2">
                      <p className="flex items-center gap-1.5 text-[11px] font-medium text-subtle">
                        <Users className="size-3" /> Students
                      </p>
                      <p className="mt-0.5 text-lg font-bold leading-none text-text">{r.students}</p>
                    </div>
                    <div className="rounded-lg bg-surface-sunken px-3 py-2">
                      <p className="flex items-center gap-1.5 text-[11px] font-medium text-subtle">
                        <Clock className="size-3" /> Timing
                      </p>
                      <p className="mt-0.5 text-sm font-bold leading-none text-text">
                        {r.departure || "—"}
                        {r.arrival ? ` → ${r.arrival}` : ""}
                      </p>
                    </div>
                  </div>
                  {r.stops.length > 0 && (
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted">
                        <MapPin className="size-3.5" /> Stops ({r.stops.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {r.stops.map((s, i) => (
                          <span key={i} className="rounded-md bg-surface-hover px-2 py-0.5 text-xs text-text">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {routes.length === 0 && (
        <Card>
          <CardContent className="flex items-center gap-3 py-5 text-sm text-muted">
            <Inbox className="size-5 shrink-0 text-subtle" />
            Once a route is linked to your account, you&rsquo;ll see your stops, student count and daily timing
            here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Download,
  Rocket,
  ShieldCheck,
  Smartphone,
  Star,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  StatCard,
  useToast,
} from "@/components/ui";

export default function MobilePage() {
  const { toast } = useToast();

  const [appFilter, setAppFilter] = useState("");

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Mobile Apps"
        description="Student, parent, teacher and admin apps — versions, adoption and releases."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Export notes",
                  description: "No releases available to export yet.",
                  variant: "info",
                })
              }
            >
              <Download className="size-4" />
              Export notes
            </Button>
            <Button
              onClick={() =>
                toast({
                  title: "Push update",
                  description: "No apps are configured to push updates to yet.",
                  variant: "info",
                })
              }
            >
              <Rocket className="size-4" />
              Push update
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total installs" value={0} icon={Download} tone="indigo" />
        <StatCard label="Average rating" value={0} suffix=" / 5" icon={Star} tone="amber" />
        <StatCard label="Crash-free sessions" value={0} suffix="%" icon={ShieldCheck} tone="emerald" />
        <StatCard label="Apps published" value={0} icon={Smartphone} tone="cyan" />
      </div>

      <Card>
        <CardHeader>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">Apps</h2>
            <p className="mt-0.5 text-xs text-muted">
              Published mobile apps and their adoption will appear here.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No apps configured"
            description="Configure a mobile app to track versions, adoption and releases."
            icon={<Smartphone className="size-5" />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-wrap">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">Release notes</h2>
            <p className="mt-0.5 text-xs text-muted">
              Every build shipped to the Play Store and App Store.
            </p>
          </div>
          <div className="w-52">
            <Select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              placeholder="All apps"
              options={[]}
              aria-label="Filter releases by app"
            />
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No releases yet"
            description="Builds shipped to the app stores will be listed here."
            icon={<Rocket className="size-5" />}
          />
        </CardContent>
      </Card>
    </div>
  );
}

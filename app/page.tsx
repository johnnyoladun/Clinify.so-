"use client"

import { Sidebar } from "@/components/sidebar"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PanelLeft, Github } from "lucide-react"

export default function Dashboard() {
  const stats = [
    {
      title: "Total Revenue",
      value: "$1,250.00",
      trend: { value: "+12.5%", isPositive: true },
      subtitle: "Trending up this month",
      description: "Visitors for the last 6 months",
    },
    {
      title: "New Customers",
      value: "1,234",
      trend: { value: "-20%", isPositive: false },
      subtitle: "Down 20% this period",
      description: "Acquisition needs attention",
    },
    {
      title: "Active Accounts",
      value: "45,678",
      trend: { value: "+12.5%", isPositive: true },
      subtitle: "Strong user retention",
      description: "Engagement exceed targets",
    },
    {
      title: "Growth Rate",
      value: "4.5%",
      trend: { value: "+4.5%", isPositive: true },
      subtitle: "Steady performance increase",
      description: "Meets growth projections",
    },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <PanelLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Documents</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Github className="h-5 w-5" />
          </Button>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          {/* Total Visitors Card */}
          <Card className="mt-6 border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Total Visitors</h3>
                  <p className="text-sm text-muted-foreground">
                    Total for the last 3 months
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="bg-accent">
                    Last 3 months
                  </Button>
                  <Button variant="ghost" size="sm">
                    Last 30 days
                  </Button>
                  <Button variant="ghost" size="sm">
                    Last 7 days
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chart Placeholder */}
              <div className="mt-4 h-[300px] rounded-lg border border-border bg-black/20 flex items-center justify-center">
                <p className="text-muted-foreground">Chart visualization area</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

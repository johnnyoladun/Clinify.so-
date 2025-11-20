"use client"

import { 
  LayoutDashboard, 
  LifeBuoy, 
  BarChart3, 
  FolderKanban, 
  Users, 
  FileText, 
  FileBarChart, 
  FileQuestion,
  MoreHorizontal,
  Mail,
  CircleDot
} from "lucide-react"
import { Button } from "./ui/button"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: LifeBuoy, label: "Lifecycle" },
  { icon: BarChart3, label: "Analytics" },
  { icon: FolderKanban, label: "Projects" },
  { icon: Users, label: "Team" },
]

const documentItems = [
  { icon: FileText, label: "Data Library" },
  { icon: FileBarChart, label: "Reports" },
  { icon: FileQuestion, label: "Word Assistant" },
  { icon: MoreHorizontal, label: "More" },
]

export function Sidebar() {
  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-black px-3 py-4">
      {/* Logo/Brand */}
      <div className="mb-6 flex items-center gap-2 px-3">
        <CircleDot className="h-6 w-6" />
        <span className="text-lg font-semibold">Acme Inc.</span>
      </div>

      {/* Quick Create Button */}
      <Button 
        variant="default" 
        className="mb-6 w-full justify-start gap-2 bg-white text-black hover:bg-gray-200"
      >
        <CircleDot className="h-4 w-4" />
        Quick Create
      </Button>

      {/* Mail Icon Button */}
      <Button variant="ghost" size="icon" className="mb-6 ml-auto">
        <Mail className="h-5 w-5" />
      </Button>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={`w-full justify-start gap-3 ${
              item.active ? "bg-accent" : ""
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Button>
        ))}

        {/* Documents Section */}
        <div className="pt-6">
          <h3 className="mb-2 px-3 text-sm font-medium text-muted-foreground">
            Documents
          </h3>
          {documentItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </div>
      </nav>
    </div>
  )
}

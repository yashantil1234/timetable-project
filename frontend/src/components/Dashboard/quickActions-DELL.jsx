import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils/navigation";
import { Plus, Calendar, BookOpen, Users } from "lucide-react";
<import>ApiService from '/services/api';</import>

export default function QuickActions() {
  const actions = [
    {
      label: "View Timetable",
      url: createPageUrl("Timetable"),
      icon: Calendar,
      variant: "default",
      className: "bg-blue-600 hover:bg-blue-700 text-white"
    },
    {
      label: "Add Course",
      url: createPageUrl("Courses"),
      icon: BookOpen,
      variant: "outline"
    },
    {
      label: "Add Teacher", 
      url: createPageUrl("Teachers"),
      icon: Users,
      variant: "outline"
    }
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <Link key={action.label} to={action.url}>
          <Button 
            variant={action.variant}
            className={`gap-2 hover:scale-105 transition-all duration-300 shadow-lg ${action.className || ''}`}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </Button>

          {/* <div className="mt-2">
            <Link to={action.url}>
              <Button variant="link" className="text-sm">
                Go to {action.label}
              </Button>
            </Link>
          </div> */}
        </Link>
      ))}
    </div>
  );
}
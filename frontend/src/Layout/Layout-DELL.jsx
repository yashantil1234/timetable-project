import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "../utils/navigation";

import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  MapPin, 
  Calendar,
  GraduationCap,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Timetable",
    url: createPageUrl("Timetable"),
    icon: Calendar,
  },
  {
    title: "Courses",
    url: createPageUrl("Courses"),
    icon: BookOpen,
  },
  {
    title: "Teachers",
    url: createPageUrl("Teachers"),
    icon: Users,
  },
  {
    title: "Rooms",
    url: createPageUrl("Rooms"),
    icon: MapPin,
  },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Sidebar */}
        <Sidebar className="border-r border-blue-100/60 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-blue-100/60 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">EduScheduler</h2>
                <p className="text-xs text-blue-600 font-medium">College Timetable System</p>
              </div>
            </div>
          </SidebarHeader>
          
          {/* Navigation */}
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`group hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 rounded-xl mb-2 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                            : 'text-gray-600'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                            location.pathname === item.url ? 'text-white' : ''
                          }`} />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Admin Footer with popup */}
          <SidebarFooter className="border-t border-blue-100/60 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 w-full text-left">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">Admin User</p>
                    <p className="text-xs text-blue-600 truncate">Administrator</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {/* Admin Details Popup */}
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem>
                      <span>Admin Details</span>
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl shadow-lg">
                    <DialogHeader>
                      <DialogTitle>Admin Profile</DialogTitle>
                      <DialogDescription>
                        Details about the administrator of EduScheduler.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          A
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">Admin User</p>
                          <p className="text-sm text-blue-600">Administrator</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-3 text-sm text-gray-700">
                        <p><span className="font-semibold">Email:</span> admin@college.edu</p>
                        <p><span className="font-semibold">Department:</span> Computer Science</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Logout Action */}
                <DropdownMenuItem onClick={() => console.log("Logout clicked")}>
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Section */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100/60 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-blue-50 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                EduScheduler
              </h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

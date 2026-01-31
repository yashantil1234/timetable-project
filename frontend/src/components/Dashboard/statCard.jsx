import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {TrendingUp}  from "lucide-react";


const colorClasses = {
  blue: {
    bg: "bg-blue-500",
    text: "text-blue-600",
    bgLight: "bg-blue-50",
    borderLight: "border-blue-100"
  },
  green: {
    bg: "bg-green-500", 
    text: "text-green-600",
    bgLight: "bg-green-50",
    borderLight: "border-green-100"
  },
  purple: {
    bg: "bg-purple-500",
    text: "text-purple-600", 
    bgLight: "bg-purple-50",
    borderLight: "border-purple-100"
  },
  orange: {
    bg: "bg-orange-500",
    text: "text-orange-600",
    bgLight: "bg-orange-50", 
    borderLight: "border-orange-100"
  },
  pink: {
    bg: "bg-pink-500",
    text: "text-pink-600",
    bgLight: "bg-pink-50",
    borderLight: "border-pink-100"
  }
};

export default function StatCard({ title, value, color, icon, isLoading, onClick }) {
  const colors = colorClasses[color];
  const Icon = icon;

  return (
    <div
      className={`hover:shadow-lg transition-all duration-300 border-2 ${colors.borderLight} ${colors.bgLight} group cursor-pointer ${onClick ? 'hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">
                  {value}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${colors.bg} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300`}>
              <Icon className={`w-6 h-6 ${colors.text} group-hover:scale-110 transition-transform duration-300`} />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className={`w-4 h-4 mr-1 ${colors.text}`} />
            <span className={`font-medium ${colors.text}`}>Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
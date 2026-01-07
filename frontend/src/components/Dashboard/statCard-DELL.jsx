import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

// This object maps color names to Tailwind CSS classes for styling.
const colorStyles = {
  blue: {
    bgLight: "bg-blue-50",
    borderLight: "border-blue-100",
    text: "text-blue-800",
    iconBg: "bg-blue-100",
  },
  green: {
    bgLight: "bg-green-50",
    borderLight: "border-green-100",
    text: "text-green-800",
    iconBg: "bg-green-100",
  },
  purple: {
    bgLight: "bg-purple-50",
    borderLight: "border-purple-100",
    text: "text-purple-800",
    iconBg: "bg-purple-100",
  },
  orange: {
    bgLight: "bg-orange-50",
    borderLight: "border-orange-100",
    text: "text-orange-800",
    iconBg: "bg-orange-100",
  },
  pink: {
    bgLight: "bg-pink-50",
    borderLight: "border-pink-100",
    text: "text-pink-800",
    iconBg: "bg-pink-100",
  },
  // Add other colors from your dashboard here to prevent crashes
  cyan: {
    bgLight: "bg-cyan-50",
    borderLight: "border-cyan-100",
    text: "text-cyan-800",
    iconBg: "bg-cyan-100",
  },
  emerald: {
    bgLight: "bg-emerald-50",
    borderLight: "border-emerald-100",
    text: "text-emerald-800",
    iconBg: "bg-emerald-100",
  },
  indigo: {
    bgLight: "bg-indigo-50",
    borderLight: "border-indigo-100",
    text: "text-indigo-800",
    iconBg: "bg-indigo-100",
  },
  // A default color is used if the specified color is not found
  default: {
    bgLight: "bg-gray-50",
    borderLight: "border-gray-100",
    text: "text-gray-800",
    iconBg: "bg-gray-100",
  },
};

export default function StatCard({ title, value, icon: Icon, color = "default", isLoading, subtitle, className }) {
  // If the provided color doesn't exist in the styles, use the default style.
  const styles = colorStyles[color] || colorStyles.default;

  // Renders a skeleton loader while data is being fetched.
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${styles.bgLight} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${styles.iconBg}`}>
            <Icon className={`w-6 h-6 ${styles.text}`} />
          </div>
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
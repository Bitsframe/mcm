// components/ResponsiveStatsCard.tsx
import { FC, ReactNode } from "react";

interface ResponsiveStatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  colorClass: string;
  bgColorClass: string;
}

const ResponsiveStatsCard: FC<ResponsiveStatsCardProps> = ({
  title,
  value,
  icon,
  colorClass,
  bgColorClass,
}) => {
  return (
    <div className={`w-full p-4 sm:p-6 rounded-lg shadow-sm ${bgColorClass}`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{title}</p>
          <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveStatsCard;

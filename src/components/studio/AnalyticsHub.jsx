import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import StreamerAnalytics from "./StreamerAnalytics";
import MonetizationRevenue from "./MonetizationRevenue";

export default function AnalyticsHub() {
  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 100),
    staleTime: 5 * 60 * 1000,
  });

  const { data: analyticsRows = [] } = useQuery({
    queryKey: ["video-analytics-all"],
    queryFn: () => base44.entities.VideoAnalytics.list("-date", 200),
    staleTime: 5 * 60 * 1000,
  });

  const activeVideos = useMemo(() => videos.filter(v => v.status !== "deleted" && v.status !== "uploading"), [videos]);
  const hasRealData = activeVideos.length > 0 || analyticsRows.length > 0;

  return (
    <div className="space-y-8 pb-6">
      <StreamerAnalytics />
      {hasRealData && (
        <>
          <div className="h-px bg-blue-900/30" />
          <MonetizationRevenue />
        </>
      )}
    </div>
  );
}
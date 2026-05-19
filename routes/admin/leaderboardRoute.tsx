import React, { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";
import TabSkeleton from "./TabSkeleton";

const LeaderboardTab = lazy(() => import("@/components/feature/admin/tabs/LeaderboardTab"));

export const leaderboardRoute: RouteObject = {
  path: "leaderboard",
  element: (
    <Suspense fallback={<TabSkeleton />}>
      <LeaderboardTab />
    </Suspense>
  ),
};

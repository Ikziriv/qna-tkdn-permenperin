import React, { Suspense, lazy } from "react";
import type { RouteObject } from "react-router-dom";
import TabSkeleton from "./TabSkeleton";

const UsersTab = lazy(() => import("@/components/feature/admin/tabs/UsersTab"));

export const usersRoute: RouteObject = {
  path: "users",
  element: (
    <Suspense fallback={<TabSkeleton />}>
      <UsersTab />
    </Suspense>
  ),
};

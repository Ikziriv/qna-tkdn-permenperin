import React from "react";
import type { RouteObject } from "react-router-dom";
import { overviewRoute } from "./overviewRoute";
import { usersRoute } from "./usersRoute";
import { attemptsRoute } from "./attemptsRoute";
import { leaderboardRoute } from "./leaderboardRoute";
import { reportsRoute } from "./reportsRoute";
import { AdminLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/feature/auth";

export const adminRoutes: RouteObject = {
  path: "/admin",
  element: (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <AdminLayout />
    </ProtectedRoute>
  ),
  children: [
    overviewRoute,
    usersRoute,
    attemptsRoute,
    leaderboardRoute,
    reportsRoute,
  ],
};

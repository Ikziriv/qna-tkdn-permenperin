import { useRoutes, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { adminRoutes } from "@/routes/admin";

const AdminRouter: React.FC = () => {
  const { authUser, isAdminLevel } = useAuth();

  if (!authUser || !isAdminLevel) {
    return <Navigate to="/" replace />;
  }

  return useRoutes([adminRoutes]);
};

export default AdminRouter;

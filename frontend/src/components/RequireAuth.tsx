import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

type Props = {
  children: React.ReactNode;
  requireStaff?: boolean;
  requirePresenceChecker?: boolean;
};

export default function RequireAuth({ children, requireStaff, requirePresenceChecker }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireStaff && !user.is_staff) {
    return <Navigate to="/" replace />;
  }

  if (requirePresenceChecker && !user.is_staff && !user.is_presence_checker) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

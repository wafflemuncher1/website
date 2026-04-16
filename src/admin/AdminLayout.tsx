import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet,  } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminHeader from "./components/AdminHeader";


const ADMIN_EMAIL = "zanerisinger@gmail.com"; // change if needed

const AdminLayout = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        navigate("/login", { replace: true });
        return;
      }

      if (user.email !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
        return;
      }

      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-background flex flex-col">
    <AdminHeader />
    <main className="flex-1">
      <Outlet />
    </main>
  </div>
);

};

export default AdminLayout;
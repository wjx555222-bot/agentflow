import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Bot, Wrench, GitBranch, LayoutDashboard, Moon, Sun, Sparkles } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/agents", icon: Bot, label: "Agents" },
  { to: "/tools", icon: Wrench, label: "Tools" },
  { to: "/workflows", icon: GitBranch, label: "Workflows" },
];

export default function Layout() {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => void setMounted(true), []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="w-64 border-r border-gray-100 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100 dark:border-gray-800/50">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">AgentFlow</span>
            <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400">v1.1</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link-active" : "sidebar-link-inactive"}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {location.pathname === item.to && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 dark:border-gray-800/50">
          <button
            onClick={() => setDark(!dark)}
            className="sidebar-link sidebar-link-inactive w-full"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className={mounted ? "page-enter" : ""}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

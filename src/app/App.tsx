import { NavLink, Outlet } from "react-router-dom";

export default function App() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-3 flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">
            Screen Proto
          </span>
          <nav className="flex gap-2">
            <NavLink to="/equipment-anomalies" className={navLinkClass}>
              장비이상목록(가제)
            </NavLink>
            <NavLink to="/screen-2" className={navLinkClass}>
              Screen2
            </NavLink>
            <NavLink to="/screen-3" className={navLinkClass}>
              Screen3
            </NavLink>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

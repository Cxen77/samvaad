import { NavLink } from "react-router-dom";

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) =>
        `flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${isActive
          ? "bg-sky-600 text-white shadow-sm"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
        }`
      }
    >
      <Icon className="w-5 h-5" />
    </NavLink>
  );
}

export default NavItem;

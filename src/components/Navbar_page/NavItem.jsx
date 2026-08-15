import { NavLink } from "react-router-dom";

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-20 h-12 rounded-xl transition-all duration-200 ${isActive
          ? "bg-gradient-to-r from-sky-50 to-white text-sky-600 shadow-sm border border-sky-100"
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "drop-shadow-sm" : ""}`} />
          <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default NavItem;

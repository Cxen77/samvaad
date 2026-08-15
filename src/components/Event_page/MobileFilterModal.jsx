import React, { useState, useRef, useEffect } from "react";
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { FaSearch, FaCalendarAlt, FaTimes, FaFilter } from "react-icons/fa";

const MobileFilterModal = ({ isOpen, onClose, onSearch, onCategory, onToggle, onDateSelect }) => {
    const [searchText, setSearchText] = useState("");
    const [activeCategory, setActiveCategory] = useState("");
    const [isOngoing, setIsOngoing] = useState(true); // true = All, false = Upcoming
    const [selectedDate, setSelectedDate] = useState("");
    const [showCalendar, setShowCalendar] = useState(false);
    const modalRef = useRef(null);

    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    const categories = ["Hackathon", "Workshop", "Seminar", "Tournament", "Meetup", "Project", "Game", "Sport"];
    const months = Array.from({ length: 12 }, (_, i) =>
        new Date(0, i).toLocaleString("default", { month: "short" })
    );
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

    // Initial load sync if needed (optional, depends on if props pass initial state)
    // For now we keep local state

    const handleCategoryClick = (cat) => {
        const newCat = cat === activeCategory ? "" : cat;
        setActiveCategory(newCat);
        onCategory?.(newCat);
    };

    const handleDateSelect = (day) => {
        const monthStr = (calendarMonth + 1).toString().padStart(2, "0");
        const dateStr = `${calendarYear}-${monthStr}-${day.toString().padStart(2, "0")}`;

        if (selectedDate === dateStr) {
            setSelectedDate("");
            onDateSelect?.("");
        } else {
            setSelectedDate(dateStr);
            onDateSelect?.(dateStr);
        }
        setShowCalendar(false);
    };

    const handleClearAll = () => {
        setSearchText("");
        setActiveCategory("");
        setIsOngoing(true);
        setSelectedDate("");

        onSearch?.("");
        onCategory?.("");
        onToggle?.("All");
        onDateSelect?.("");
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none transition-all duration-300 ease-out">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={onClose}
            />

            <div
                ref={modalRef}
                className="bg-white dark:bg-gray-900 w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] rounded-t-[2rem] sm:rounded-2xl shadow-2xl flex flex-col pointer-events-auto relative transform transition-transform animate-slide-up sm:animate-in sm:zoom-in-95 duration-200 border dark:border-gray-800"
            >
                {/* Drag Handle */}
                <div className="sm:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full cursor-pointer" />
                </div>

                {/* Header */}
                <div className="px-5 pb-3 pt-2 sm:pt-4 flex justify-between items-center border-b border-gray-50 dark:border-gray-800">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            Filter Events
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Find exactly what you need</p>
                    </div>

                    <button
                        onClick={handleClearAll}
                        className="text-xs font-bold text-sky-600 hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Reset
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">

                    {/* View Toggle */}
                    <div className="bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl flex shadow-inner">
                        <button
                            onClick={() => { setIsOngoing(true); onToggle?.("All"); }}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${isOngoing
                                ? 'bg-white dark:bg-gray-700 text-sky-600 dark:text-sky-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            All Events
                        </button>
                        <button
                            onClick={() => { setIsOngoing(false); onToggle?.("Upcoming"); }}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${!isOngoing
                                ? 'bg-white dark:bg-gray-700 text-sky-600 dark:text-sky-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Upcoming
                        </button>
                    </div>

                    {/* Search */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Search</label>
                        <div className="relative group">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-sky-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    onSearch?.(e.target.value);
                                }}
                                className="w-full pl-9 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Categories</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all active:scale-95 ${activeCategory === cat
                                        ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-200 dark:shadow-sky-900/30"
                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calendar Date */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Specific Date</label>
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl transition-all ${selectedDate
                                ? "bg-sky-50 border-sky-200 text-sky-700"
                                : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"
                                }`}
                        >
                            <span className="text-sm font-medium">
                                {selectedDate || "Select Date"}
                            </span>
                            <FaCalendarAlt className={selectedDate ? "text-sky-500" : "text-gray-400"} />
                        </button>

                        {/* Dropdown Calendar */}
                        {showCalendar && (
                            <div className="mt-2 bg-white border border-gray-200 rounded-xl p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                {/* Calendar Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                                            className="px-2 py-1 bg-gray-100 rounded text-xs font-bold hover:bg-gray-200"
                                        >
                                            {months[calendarMonth]}
                                        </button>
                                        <button
                                            onClick={() => setShowYearDropdown(!showYearDropdown)}
                                            className="px-2 py-1 bg-gray-100 rounded text-xs font-bold hover:bg-gray-200"
                                        >
                                            {calendarYear}
                                        </button>
                                    </div>
                                    <button onClick={() => setShowCalendar(false)} className="text-gray-400 hover:text-gray-600">
                                        <FaTimes />
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                                        <div key={d} className="text-[10px] font-bold text-gray-400">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {Array.from(
                                        { length: new Date(calendarYear, calendarMonth + 1, 0).getDate() },
                                        (_, i) => {
                                            const day = i + 1;
                                            const isSelected = selectedDate.endsWith(`-${day.toString().padStart(2, "0")}`);
                                            return (
                                                <div
                                                    key={day}
                                                    onClick={() => handleDateSelect(day)}
                                                    className={`h-7 flex items-center justify-center rounded-md text-xs font-medium cursor-pointer transition ${isSelected
                                                        ? "bg-sky-600 text-white shadow-sm"
                                                        : "text-gray-700 hover:bg-sky-50"
                                                        }`}
                                                >
                                                    {day}
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-50 dark:border-gray-800 safe-area-pb">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <FaFilter size={12} className="text-gray-400 dark:text-gray-500" />
                        Show Results
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

MobileFilterModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSearch: PropTypes.func,
    onCategory: PropTypes.func,
    onToggle: PropTypes.func,
    onDateSelect: PropTypes.func
};

export default MobileFilterModal;

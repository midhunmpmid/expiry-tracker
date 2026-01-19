import React, { useState, useRef, useEffect } from "react";
import "./DatePicker.css";

const MONTHS = [
  { name: "January", num: "01" },
  { name: "February", num: "02" },
  { name: "March", num: "03" },
  { name: "April", num: "04" },
  { name: "May", num: "05" },
  { name: "June", num: "06" },
  { name: "July", num: "07" },
  { name: "August", num: "08" },
  { name: "September", num: "09" },
  { name: "October", num: "10" },
  { name: "November", num: "11" },
  { name: "December", num: "12" },
];

function DatePicker({ value, onChange, required }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [year, month] = value.split("-");
      return { year: parseInt(year), month: parseInt(month) - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value) {
      const [year, month] = value.split("-");
      setViewDate({ year: parseInt(year), month: parseInt(month) - 1 });
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calculatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const dropdownHeight = 250;
      const spaceBelow = window.innerHeight - rect.bottom;

      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        // Open above
        setDropdownPosition({
          top: rect.top - dropdownHeight - 4,
          left: rect.left,
        });
      } else {
        // Open below
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
    }
  };

  const handleInputClick = () => {
    calculatePosition();
    setIsOpen(!isOpen);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
    const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const isSelected = value === dateStr;
      const isToday = new Date().toISOString().split("T")[0] === dateStr;

      days.push(
        <div
          key={day}
          className={`calendar-day ${isSelected ? "selected" : ""} ${
            isToday ? "today" : ""
          }`}
          onClick={() => handleDayClick(day)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const handleDayClick = (day) => {
    const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    onChange({ target: { value: dateStr } });
    setIsOpen(false);
  };

  const handleMonthChange = (e) => {
    setViewDate({ ...viewDate, month: parseInt(e.target.value) });
  };

  const handleYearChange = (e) => {
    setViewDate({ ...viewDate, year: parseInt(e.target.value) });
  };

  const handlePrevMonth = () => {
    if (viewDate.month === 0) {
      setViewDate({ year: viewDate.year - 1, month: 11 });
    } else {
      setViewDate({ ...viewDate, month: viewDate.month - 1 });
    }
  };

  const handleNextMonth = () => {
    if (viewDate.month === 11) {
      setViewDate({ year: viewDate.year + 1, month: 0 });
    } else {
      setViewDate({ ...viewDate, month: viewDate.month + 1 });
    }
  };

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 1; y <= currentYear + 5; y++) {
    years.push(y);
  }

  const formatDisplayValue = () => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="date-picker-container" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        className="date-picker-input"
        value={formatDisplayValue()}
        onClick={handleInputClick}
        readOnly
        required={required}
        placeholder="dd/mm/yyyy"
      />

      {isOpen && (
        <div
          className="date-picker-dropdown"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <div className="date-picker-header">
            <button type="button" className="nav-btn" onClick={handlePrevMonth}>
              ◀
            </button>
            <div className="date-picker-selects">
              <select value={viewDate.month} onChange={handleMonthChange}>
                {MONTHS.map((month, index) => (
                  <option key={index} value={index}>
                    {month.name} ({month.num})
                  </option>
                ))}
              </select>
              <select value={viewDate.year} onChange={handleYearChange}>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="nav-btn" onClick={handleNextMonth}>
              ▶
            </button>
          </div>

          <div className="calendar-weekdays">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>

          <div className="calendar-days">{generateCalendarDays()}</div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;

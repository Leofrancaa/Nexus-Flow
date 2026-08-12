"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function DatePicker({ value, onChange, placeholder = "Selecione uma data" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Inicializar displayMonth baseado no valor selecionado
  useEffect(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      setDisplayMonth(new Date(year, month - 1));
    }
  }, [value]);

  const handleDateClick = (day: number) => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1));
  };

  const getDaysInMonth = () => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];

    // Adicionar dias vazios no início
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Adicionar dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return placeholder;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const isSelectedDate = (day: number) => {
    if (!value) return false;
    const [year, month, selectedDay] = value.split('-').map(Number);
    return (
      day === selectedDay &&
      displayMonth.getMonth() === month - 1 &&
      displayMonth.getFullYear() === year
    );
  };

  const isToday = (day: number) => {
    // Criar data no timezone local para evitar problemas
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return (
      day === today.getDate() &&
      displayMonth.getMonth() === today.getMonth() &&
      displayMonth.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-full items-center justify-between rounded-[14px] border border-line bg-elevated px-4 py-3 text-left text-fg transition-[border-color,box-shadow,background-color] duration-200 hover:border-line/80 focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20"
      >
        <span className={value ? "text-[var(--card-text)]" : "text-[var(--card-text)]/50"}>
          {formatDisplayDate(value)}
        </span>
        <Calendar className="w-5 h-5 text-[var(--card-text)]/70" />
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-[110] mt-2 w-full rounded-[18px] border border-white/[0.07] bg-[linear-gradient(160deg,#1a1d21_0%,#111316_100%)] p-4 shadow-[0_24px_60px_rgba(0,0,0,.58)] sm:min-w-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--card-text)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h3 className="text-base font-semibold text-[var(--card-text)]">
              {MESES[displayMonth.getMonth()]} {displayMonth.getFullYear()}
            </h3>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--card-text)] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="text-center text-xs font-medium text-[var(--card-text)]/60 py-2"
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} />;
              }

              const selected = isSelectedDate(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`
                    aspect-square rounded-lg text-sm font-medium transition-all
                    ${selected
                      ? 'bg-brand text-bg shadow-[0_0_18px_rgba(212,255,0,.18)]'
                      : today
                        ? 'bg-brand/10 text-brand hover:bg-brand/15'
                        : 'text-[var(--card-text)] hover:bg-[var(--hover-bg)]'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer com atalho "Hoje" */}
          <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
            <button
              type="button"
              onClick={() => {
                // Criar data no timezone local
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                onChange(dateStr);
                setIsOpen(false);
              }}
              className="w-full py-2 rounded-lg text-sm font-medium text-[var(--card-text)] hover:bg-[var(--hover-bg)] transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

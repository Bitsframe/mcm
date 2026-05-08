"use client";

import React, { useMemo, useState } from "react";
import Picker from "react-mobile-picker";
import { useTranslation } from "react-i18next";
import { ChevronDown, CalendarDays } from "lucide-react";
import { translationConstant } from "@/utils/translationConstants";
import {
  buildYearOptions,
  buildMonthOptionsForYear,
  buildDayOptionsForDate,
  normalizeDobParts,
  monthShortLabel,
} from "./dobUtils";

type WheelValue = { year: string; month: string; day: string };

const triggerClassName =
  "group w-full min-h-[46px] flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-[#f1f4f9] px-3 text-left text-base text-black transition-colors hover:border-gray-300 dark:border-gray-600 dark:bg-[#122136] dark:text-white dark:hover:border-gray-500";

function formatDisplay(full: string) {
  if (!full || !/^\d{4}-\d{2}-\d{2}$/.test(full)) return "";
  const [y, mo, d] = full.split("-");
  const mi = parseInt(mo, 10);
  const monthName = new Date(2024, mi - 1, 1).toLocaleString(undefined, {
    month: "short",
  });
  return `${monthName} ${parseInt(d, 10)}, ${y}`;
}

type Props = {
  dobParts: { y: string; m: string; d: string };
  formDob: string;
  onCommit: (next: ReturnType<typeof normalizeDobParts>) => void;
};

export function DobWheelField({ dobParts, formDob, onCommit }: Props) {
  const { t } = useTranslation(translationConstant.APPOINMENTS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [wheel, setWheel] = useState<WheelValue>({
    year: "",
    month: "",
    day: "",
  });

  const openSheet = () => {
    if (dobParts.y && dobParts.m && dobParts.d) {
      setWheel({
        year: dobParts.y,
        month: dobParts.m,
        day: dobParts.d,
      });
    } else {
      const y = String(new Date().getFullYear() - 25);
      const n = normalizeDobParts(y, "01", "01");
      setWheel({ year: n.y, month: n.m, day: n.d });
    }
    setSheetOpen(true);
  };

  const display = useMemo(
    () => (formDob ? formatDisplay(formDob) : ""),
    [formDob]
  );

  const years = useMemo(() => buildYearOptions(), []);
  const months = useMemo(() => buildMonthOptionsForYear(wheel.year), [wheel.year]);
  const days = useMemo(
    () => buildDayOptionsForDate(wheel.year, wheel.month),
    [wheel.year, wheel.month]
  );

  const pickerValue = useMemo(
    () => ({
      year: wheel.year,
      month: wheel.month,
      day: wheel.day,
    }),
    [wheel]
  );

  const handlePickerChange = (next: WheelValue) => {
    const y = String(next.year ?? "");
    const m = String(next.month ?? "").padStart(2, "0");
    const d = String(next.day ?? "").padStart(2, "0");
    const n = normalizeDobParts(y, m, d);
    setWheel({ year: n.y, month: n.m, day: n.d });
  };

  const handleDone = () => {
    const n = normalizeDobParts(wheel.year, wheel.month, wheel.day);
    onCommit(n);
    setSheetOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className={triggerClassName}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/80 text-blue-600 shadow-sm dark:bg-[#1a2d4a] dark:text-blue-400">
            <CalendarDays className="h-4 w-4" aria-hidden />
          </span>
          <span
            className={`min-w-0 truncate ${
              display ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {display || "Select date of birth"}
          </span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 opacity-50 transition-opacity group-hover:opacity-80" aria-hidden />
      </button>

      {sheetOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dob-wheel-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="relative z-10 w-full max-w-md rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#0e1725] sm:rounded-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <span id="dob-wheel-title" className="font-semibold text-gray-900 dark:text-white">
                {t("Appoinments_k9")}
              </span>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                onClick={() => setSheetOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="px-2 pb-2 pt-4">
              <div className="relative mx-auto max-w-sm rounded-xl border border-gray-100 bg-[#f8fafc] dark:border-gray-700 dark:bg-[#111a2a]">
                <div
                  className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-10 -translate-y-1/2 rounded-md bg-gray-200/40 dark:bg-white/5"
                  aria-hidden
                />
                <Picker
                  height={216}
                  itemHeight={40}
                  wheelMode="natural"
                  value={pickerValue}
                  onChange={(v) =>
                    handlePickerChange(v as WheelValue)
                  }
                  className="relative z-0 font-medium text-gray-900 dark:text-white"
                >
                  <Picker.Column name="year">
                    {years.map((yv) => (
                      <Picker.Item key={yv} value={yv}>
                        {({ selected }) => (
                          <span
                            className={`block py-2 text-center text-sm ${
                              selected ? "text-[#0066ff] font-semibold" : "opacity-50"
                            }`}
                          >
                            {yv}
                          </span>
                        )}
                      </Picker.Item>
                    ))}
                  </Picker.Column>
                  <Picker.Column name="month">
                    {months.map((mv) => (
                      <Picker.Item key={mv} value={mv}>
                        {({ selected }) => (
                          <span
                            className={`block py-2 text-center text-sm ${
                              selected ? "text-[#0066ff] font-semibold" : "opacity-50"
                            }`}
                          >
                            {monthShortLabel(mv)}
                          </span>
                        )}
                      </Picker.Item>
                    ))}
                  </Picker.Column>
                  <Picker.Column name="day">
                    {days.map((dv) => (
                      <Picker.Item key={dv} value={dv}>
                        {({ selected }) => (
                          <span
                            className={`block py-2 text-center text-sm tabular-nums ${
                              selected ? "text-[#0066ff] font-semibold" : "opacity-50"
                            }`}
                          >
                            {parseInt(dv, 10)}
                          </span>
                        )}
                      </Picker.Item>
                    ))}
                  </Picker.Column>
                </Picker>
              </div>
            </div>

            <div className="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-700">
              <button
                type="button"
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={() => setSheetOpen(false)}
              >
                {t("Appoinments_k58")}
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-[#0066ff] py-2.5 text-sm font-semibold text-white hover:bg-[#0052cc]"
                onClick={handleDone}
              >
                {t("Appoinments_k22")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

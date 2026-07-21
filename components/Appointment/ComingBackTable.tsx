"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Picker from "react-mobile-picker";
import { format } from "date-fns";
import { Search, CalendarDays, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import {
  buildYearOptions,
  buildMonthOptionsForYear,
  buildDayOptionsForDate,
  normalizeDobParts,
  monthShortLabel,
} from "@/components/Appointment/Add_Appointment_Modal/dobUtils";

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  address?: string;
  phone?: string;
  date_and_time?: string | null;
  dob?: string | null;
  sex?: string;
}

interface PatientListProps {
  data: Patient[];
  onSelect?: (patient: Patient | null) => void;
}

type WheelValue = { year: string; month: string; day: string };

const searchInputClass =
  "w-full min-h-[46px] rounded-lg border border-gray-200 bg-[#f1f4f9] px-3 py-2 pl-10 text-base text-black outline-none transition-shadow placeholder:text-gray-500 focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 dark:border-gray-600 dark:bg-[#122136] dark:text-white dark:placeholder:text-gray-400";

const filterTriggerClass =
  "flex min-h-[46px] w-full max-w-md items-center justify-between gap-2 rounded-lg border border-gray-200 bg-[#f1f4f9] px-3 text-left text-sm text-black transition-colors hover:border-gray-300 dark:border-gray-600 dark:bg-[#122136] dark:text-white";

function patientToYmd(dob: string | null | undefined): string | null {
  if (!dob) return null;
  const trimmed = dob.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return format(d, "yyyy-MM-dd");
}

function formatDobDisplay(dob: string | null | undefined): string {
  if (!dob) return "—";
  const trimmed = dob.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    const local = new Date(y, m - 1, d);
    if (Number.isNaN(local.getTime())) return "—";
    return format(local, "MMM d, yyyy");
  }
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, "MMM d, yyyy");
}

const ComingBackTable: React.FC<PatientListProps> = ({ data, onSelect }) => {
  const { t } = useTranslation(translationConstant.APPOINMENTS);
  const [searchQuery, setSearchQuery] = useState("");
  /** Exact calendar day filter; empty = any */
  const [dobFilterYmd, setDobFilterYmd] = useState("");
  const [filteredData, setFilteredData] = useState<Patient[]>(data);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);

  const [dobWheelOpen, setDobWheelOpen] = useState(false);
  const [wheel, setWheel] = useState<WheelValue>({
    year: "",
    month: "",
    day: "",
  });

  const runFilter = useCallback(
    (query: string, ymd: string, source: Patient[]) => {
      let filtered = source;

      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          (patient) =>
            patient.first_name.toLowerCase().includes(q) ||
            patient.last_name.toLowerCase().includes(q)
        );
      }

      if (ymd) {
        filtered = filtered.filter((patient) => patientToYmd(patient.dob) === ymd);
      }

      setFilteredData(filtered);
    },
    []
  );

  useEffect(() => {
    runFilter(searchQuery, dobFilterYmd, data);
  }, [data, searchQuery, dobFilterYmd, runFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const openDobWheel = () => {
    if (dobFilterYmd && /^\d{4}-\d{2}-\d{2}$/.test(dobFilterYmd)) {
      const [y, m, d] = dobFilterYmd.split("-");
      const n = normalizeDobParts(y, m, d);
      setWheel({ year: n.y, month: n.m, day: n.d });
    } else {
      const y = String(new Date().getFullYear() - 35);
      const n = normalizeDobParts(y, "01", "01");
      setWheel({ year: n.y, month: n.m, day: n.d });
    }
    setDobWheelOpen(true);
  };

  const pickerValue = useMemo(
    () => ({ year: wheel.year, month: wheel.month, day: wheel.day }),
    [wheel]
  );

  const years = useMemo(() => buildYearOptions(), []);
  const months = useMemo(() => buildMonthOptionsForYear(wheel.year), [wheel.year]);
  const days = useMemo(
    () => buildDayOptionsForDate(wheel.year, wheel.month),
    [wheel.year, wheel.month]
  );

  const handlePickerChange = (next: WheelValue) => {
    const y = String(next.year ?? "");
    const m = String(next.month ?? "").padStart(2, "0");
    const d = String(next.day ?? "").padStart(2, "0");
    const n = normalizeDobParts(y, m, d);
    setWheel({ year: n.y, month: n.m, day: n.d });
  };

  const applyDobFilter = () => {
    const n = normalizeDobParts(wheel.year, wheel.month, wheel.day);
    if (n.full) setDobFilterYmd(n.full);
    setDobWheelOpen(false);
  };

  const clearDobFilter = () => {
    setDobFilterYmd("");
    setDobWheelOpen(false);
  };

  const dobFilterLabel = useMemo(() => {
    if (!dobFilterYmd) return t("Appoinments_k82");
    return formatDobDisplay(dobFilterYmd);
  }, [dobFilterYmd, t]);

  const handleSelectPatient = (id: number) => {
    setSelectedPatient(id);
    const patient = data.find((p) => p.id === id) || null;
    onSelect?.(patient ?? null);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="coming-back-search">
          {t("Appoinments_k65")}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            id="coming-back-search"
            type="search"
            autoComplete="off"
            placeholder={t("Appoinments_k83")}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className={searchInputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {t("Appoinments_k84")}
          </span>
          {dobFilterYmd ? (
            <button
              type="button"
              onClick={clearDobFilter}
              className="inline-flex items-center gap-1 self-start text-xs font-medium text-[#0066ff] hover:underline sm:self-auto"
            >
              <X className="h-3.5 w-3.5" />
              {t("Appoinments_k85")}
            </button>
          ) : null}
        </div>
        <button type="button" onClick={openDobWheel} className={filterTriggerClass}>
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/90 text-blue-600 shadow-sm dark:bg-[#1a2d4a] dark:text-blue-400">
              <CalendarDays className="h-4 w-4" aria-hidden />
            </span>
            <span className={`truncate ${dobFilterYmd ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}>
              {dobFilterLabel}
            </span>
          </span>
        </button>
      </div>

      {filteredData.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t("Appoinments_k86")}
        </p>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="space-y-2 sm:hidden">
            {filteredData.map((patient) => (
              <li key={patient.id}>
                <label className="flex cursor-pointer gap-3 rounded-xl border border-gray-200 bg-[#f8fafc] p-3 dark:border-gray-700 dark:bg-[#0a1424]">
                  <input
                    type="radio"
                    name="coming-back-select"
                    checked={selectedPatient === patient.id}
                    onChange={() => handleSelectPatient(patient.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#0066ff]"
                    aria-label={`${patient.first_name} ${patient.last_name}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      ID {patient.id} · {formatDobDisplay(patient.dob)}
                    </p>
                  </div>
                </label>
              </li>
            ))}
          </ul>

          {/* sm+: table */}
          <div className="hidden sm:block sm:overflow-x-auto sm:rounded-xl sm:border sm:border-gray-200 dark:sm:border-gray-700">
            <table className="w-full min-w-[520px] table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#0a1424]">
                  <th className="w-14 px-3 py-3 font-semibold text-gray-700 dark:text-gray-200"> </th>
                  <th className="w-20 px-3 py-3 font-semibold text-gray-700 dark:text-gray-200">ID</th>
                  <th className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-200">
                    {t("Appoinments_k26")}
                  </th>
                  <th className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-200">
                    {t("Appoinments_k12")}
                  </th>
                  <th className="w-36 px-3 py-3 font-semibold text-gray-700 dark:text-gray-200">
                    {t("Appoinments_k9")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="px-3 py-3 align-middle">
                      <input
                        type="radio"
                        name="coming-back-select"
                        checked={selectedPatient === patient.id}
                        onChange={() => handleSelectPatient(patient.id)}
                        className="h-4 w-4 accent-[#0066ff]"
                        aria-label={`${patient.first_name} ${patient.last_name}`}
                      />
                    </td>
                    <td className="px-3 py-3 align-middle tabular-nums text-gray-600 dark:text-gray-300">
                      {patient.id}
                    </td>
                    <td className="px-3 py-3 align-middle font-medium text-gray-900 dark:text-white">
                      {patient.first_name}
                    </td>
                    <td className="px-3 py-3 align-middle text-gray-800 dark:text-gray-200">
                      {patient.last_name}
                    </td>
                    <td className="px-3 py-3 align-middle text-gray-600 dark:text-gray-300">
                      {formatDobDisplay(patient.dob)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {dobWheelOpen ? (
        <div
          className="fixed inset-0 z-[220] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t("Appoinments_k58")}
            onClick={() => setDobWheelOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#0e1725] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">{t("Appoinments_k84")}</span>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                onClick={() => setDobWheelOpen(false)}
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
                  onChange={(v) => handlePickerChange(v as WheelValue)}
                  className="relative z-0 font-medium text-gray-900 dark:text-white"
                >
                  <Picker.Column name="year">
                    {years.map((yv) => (
                      <Picker.Item key={yv} value={yv}>
                        {({ selected }) => (
                          <span
                            className={`block py-2 text-center text-sm ${
                              selected ? "font-semibold text-[#0066ff]" : "opacity-50"
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
                              selected ? "font-semibold text-[#0066ff]" : "opacity-50"
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
                              selected ? "font-semibold text-[#0066ff]" : "opacity-50"
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
                onClick={() => setDobWheelOpen(false)}
              >
                {t("Appoinments_k58")}
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-[#0066ff] py-2.5 text-sm font-semibold text-white hover:bg-[#0052cc]"
                onClick={applyDobFilter}
              >
                {t("Appoinments_k22")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ComingBackTable;

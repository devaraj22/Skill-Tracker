import { useQuery } from "@tanstack/react-query";
import { useId } from "react";
import { api } from "@/lib/api";
import type { Department } from "@/types";

interface DepartmentSelectorProps {
  label?: string;
  value?: string | null;
  onChange: (departmentId: string, departmentName: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export function DepartmentSelector({
  label = "Department",
  value,
  onChange,
  error,
  hint,
  required,
  disabled,
  id: customId,
}: DepartmentSelectorProps) {
  const generatedId = useId();
  const id = customId ?? generatedId;

  const { data: departments, isLoading, isError } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => api.get<Department[]>("/departments"),
  });

  const depts = departments ?? [];
  const socDepts = depts.filter((d) => d.school_group === "soc");
  const nonSocDepts = depts.filter((d) => d.school_group === "non_soc");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selected = depts.find((d) => d.id === selectedId);
    if (selected) {
      onChange(selected.id, selected.name);
    } else {
      onChange("", "");
    }
  };

  // Resolve matching ID if value is either ID or legacy department name
  const currentSelectedId = depts.find((d) => d.id === value || d.name === value || d.code === value)?.id ?? "";

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <select
        id={id}
        value={currentSelectedId}
        onChange={handleChange}
        disabled={disabled || isLoading}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-slate-300 focus:border-indigo-600"
        } ${disabled || isLoading ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "text-slate-900"}`}
      >
        <option value="">{isLoading ? "Loading SSMIET departments..." : "Select Department / Programme"}</option>

        {socDepts.length > 0 && (
          <optgroup label="School of Computing (SOC)">
            {socDepts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} — {d.name}
              </option>
            ))}
          </optgroup>
        )}

        {nonSocDepts.length > 0 && (
          <optgroup label="Non-SOC Engineering Disciplines">
            {nonSocDepts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} — {d.name}
              </option>
            ))}
          </optgroup>
        )}

        {isError && <option disabled>Failed to load departments</option>}
      </select>

      {error && (
        <span id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </span>
      )}
    </div>
  );
}

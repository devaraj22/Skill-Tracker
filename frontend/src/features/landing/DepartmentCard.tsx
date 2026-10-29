import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { DepartmentInfo } from "./departmentsData";

interface DepartmentCardProps {
  dept: DepartmentInfo;
}

export function DepartmentCard({ dept }: DepartmentCardProps) {
  const isSoc = dept.schoolGroup === "soc" || dept.category.toLowerCase().includes("computing");

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 hover:border-navy-700/80 p-6 shadow-xs hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between group animate-fadeInUp">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs font-bold tracking-wider px-2.5 py-1 rounded-md bg-navy-50 text-navy-900 border border-navy-200/90 shadow-2xs group-hover:bg-navy-900 group-hover:text-white group-hover:border-navy-900 transition-colors duration-200">
            {dept.code}
          </span>
          <span
            className={`text-xs font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md border shadow-2xs transition-colors duration-200 ${
              isSoc
                ? "bg-amber-50 text-amber-800 border-amber-200/80 group-hover:border-amber-300"
                : "bg-slate-100 text-slate-700 border-slate-200 group-hover:border-slate-300"
            }`}
          >
            {dept.category}
          </span>
        </div>

        {/* Department Name */}
        <h3 className="text-lg font-bold text-slate-900 leading-snug tracking-tight min-h-[3.25rem] flex items-center group-hover:text-navy-900 transition-colors duration-200">
          {dept.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 mt-2.5 leading-relaxed min-h-[4rem]">
          {dept.description}
        </p>

        {/* Target Competencies */}
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-navy-700 group-hover:bg-amber-500 transition-colors duration-200" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Target Competencies
            </p>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[4.25rem] content-start">
            {dept.skills.map((skill, idx) => (
              <span
                key={idx}
                className="text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200/90 hover:bg-white hover:border-slate-300 hover:shadow-2xs hover:-translate-y-0.5 px-2.5 py-1 rounded-md transition-all duration-150 cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Career Pathway
          </span>
          <span
            className="text-xs font-semibold text-slate-700 truncate max-w-[170px]"
            title={dept.careers[0]}
          >
            {dept.careers[0]}
          </span>
        </div>
        <Link
          to="/login"
          className="text-xs font-bold text-navy-900 hover:text-amber-600 inline-flex items-center gap-1 transition-colors duration-200 shrink-0 group/link"
        >
          <span>Track in Portal</span>
          <ChevronRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover/link:translate-x-1 text-navy-900 group-hover/link:text-amber-600" />
        </Link>
      </div>
    </div>
  );
}

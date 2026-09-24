import { ReactNode } from "react";
import { translationConstant } from "@/utils/translationConstants";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Action_Button_Props {
  bg_color?: string;
  text_color?: string;
  border?: string;
  label: string;
  isLoading?: boolean;
  width?: string;
  height?: string;
  onClick?: () => void;
  icon?: ReactNode;
}

/**
 * Tinted row action (Update / Archive / Assign …). Callers pass the tint
 * classes; the shape is the 28px macOS control shared by the rest of the UI.
 */
export const Action_Button: React.FC<Action_Button_Props> = ({
  bg_color,
  text_color,
  border,
  label,
  onClick,
  isLoading,
  width = "",
  height = "",
  icon,
}) => {
  const { t } = useTranslation(translationConstant.POSSALES);

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={onClick}
      className={`inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-footnote font-medium shadow-mac-sm transition-[filter,transform] hover:brightness-95 active:scale-[0.98] disabled:opacity-50 ${text_color} ${bg_color} ${border} ${width} ${height}`}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <>
          {icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
          {t(label)}
        </>
      )}
    </button>
  );
};

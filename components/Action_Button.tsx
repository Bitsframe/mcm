import { ReactNode } from "react";
import { translationConstant } from "@/utils/translationConstants";
import { Spinner } from "flowbite-react";
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
  icon?: ReactNode; // 👈 icon as a prop
}

export const Action_Button: React.FC<Action_Button_Props> = ({
  bg_color,
  text_color,
  border,
  label,
  onClick,
  isLoading,
  width = '',
  height = '',
  icon,
}) => {
  const { t } = useTranslation(translationConstant.POSSALES);

  return (
    <button
      disabled={isLoading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 text-[17px] border-[2px] ${text_color} ${bg_color} ${border} ${width} ${height} py-1 px-4 rounded-lg`}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {icon && icon}
          {t(label)}
        </>
      )}
    </button>
  );
};

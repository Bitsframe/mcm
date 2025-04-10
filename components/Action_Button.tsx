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
}

export const Action_Button: React.FC<Action_Button_Props> = ({ bg_color, text_color, border, label, onClick, isLoading, width = '', height = '' }) => {
    const bg_class = `${bg_color}`
    const text_class = text_color
    const Border = border

    const {t} = useTranslation(translationConstant.POSSALES)

    return(<button disabled={isLoading} onClick={onClick} className={`text-[17px] border-[2px] ${text_class} ${bg_class} ${Border} ${width} ${height} text-r  py-1 px-4 rounded-lg`} >
        {isLoading ? <Spinner /> : t(label)}
    </button>)
}


import { translationConstant } from "@/utils/translationConstants";
import { Spinner } from "flowbite-react";
import { useTranslation } from "react-i18next";

interface Action_Button_Props {
    bg_color: string;
    label: string;
    isLoading?: boolean;
    width?: string;
    height?: string;
    onClick?: () => void;
}

export const Action_Button: React.FC<Action_Button_Props> = ({ bg_color, label, onClick, isLoading, width = '', height = '' }) => {
    const bg_class = `${bg_color}`

    const {t} = useTranslation(translationConstant.POSSALES)

    return(<button disabled={isLoading} onClick={onClick} className={`text-[17px] text-white ${bg_class} ${width} ${height}  py-1 px-4 rounded-lg disabled:opacity-70`} >
        {isLoading ? <Spinner /> : t(label)}
    </button>)
}


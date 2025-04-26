"use client";

import React from "react";
import { capitalize_word_letter } from "@/helper/common_functions";
import {
  fields_list_components,
  find_fields,
} from "@/utils/list_options/fields_list_components";
import { Button } from "flowbite-react";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

export const Form_Component = (props: any) => {
  const {
    render_list_fields,
    data,
    reset_fields,
    handle_update,
    update_loading,
    is_edited,
    className,
  } = props;

  const { t } = useTranslation(translationConstant.WEBCONT);

  return (
    <>
      <h6 className="text-lg font-semibold dark:text-white text-gray-800 mb-4">
        {t("WebCont_k9")}
      </h6>

      {/* Added scroll bar and overflow auto for container */}
      <div
        className={`${className || "space-y-4 w-full"} max-h-72 overflow-auto`} // Scroll will appear if content exceeds max-height
      >
        {Object.keys(data).map((field, index) => {
          const splited_str = field.split("_")[0].toLocaleLowerCase();

          if (render_list_fields.includes(field)) {
            const { Component_Render } =
              fields_list_components[
                // @ts-ignore
                find_fields[splited_str] === "timer"
                  ? "input"
                  // @ts-ignore
                  : find_fields[splited_str] || "input"
              ];

            const label =
              field === "mon_timing"
                ? "Mon - Fri Timing"
                : capitalize_word_letter(field);

            return (
              <div
                key={index}
                className="rounded-lg py-1 text-sm text-gray-800"
              >
                <Component_Render key_id={field} label={label} {...props} />
              </div>
            );
          }
        })}
      </div>

      <div className="flex justify-start mt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={reset_fields}
            className="px-6 py-3 text-red-500 bg-red-100 rounded-lg text-sm"
          >
            {t("WebCont_k11")}
          </button>
          <Button
            onClick={handle_update}
            isProcessing={update_loading}
            disabled={!is_edited || update_loading}
            className="bg-[#0066FF] hover:bg-blue-600 px-5 text-sm rounded-lg"
          >
            {t("WebCont_k12")}
          </Button>
        </div>
      </div>
    </>
  );
};

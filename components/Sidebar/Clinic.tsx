import { clinca_logo } from "@/assets/images";
import Image from "next/image";
import ChangeLocationModal from "./ChangeLocationModal";
import { ChevronUp } from "lucide-react";
// import ChangeLocationModal from "./ChangeLocationModal";

export const Clinic = () => {
  return (
    <article className="w-[233px] flex justify-center">
      {/* <ChangeLocationModal /> */}
      <div className="w-[185px] h-[55px] rounded-[30px] bg-[#0066FF] p-2 flex items-center justify-start gap-3">
        <Image
          src={clinca_logo}
          alt="logo"
          className="w-[30px] h-[30px] object-contain rounded-[5px]"
        />
        <div className="flex flex-col items-start justify-center">
          {/* <h3 className="text-[#FFFFFF] text-[12px]">Clinca San Miguel</h3> */}
          <ChangeLocationModal />
        </div>
        <ChevronUp size={20} color="white" strokeWidth={3} />
        </div>
    </article>
  );
};

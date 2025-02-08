import { clinca_logo } from "@/assets/images";
import Image from "next/image";
import ChangeLocationModal from "./ChangeLocationModal";

export const Clinic = () => {
  return (
    <div className="w-[233px] bg-white flex justify-center">
      <ChangeLocationModal />
      <div className="w-[185px] h-[55px] rounded-[8px] bg-[#8AA0C2] p-2 flex items-center justify-start gap-3">
        {/* <Image
          src={clinca_logo}
          alt="logo"
          className="w-[30px] h-[30px] object-contain rounded-[5px]"
        /> */}
        {/* <div className="flex flex-col items-start justify-center">
          {/* <h3 className="text-[#FFFFFF] text-[12px]">Clinca San Miguel</h3> */}
        
          
      </div>
    </div>
  );
};

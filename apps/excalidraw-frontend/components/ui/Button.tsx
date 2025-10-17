import { memo, type ComponentType } from "react";

type Variants = "none" | "primary" | "secondary";
type Sizes = "xs" | "sm" | "md" | "lg";

type VariantRecord = Record<Variants, string>;
type SizeRecord = Record<Sizes, string>;

type IconProps = {
    size?: Sizes;
};

type ButtonProps = {
    varaint: Variants;
    size: Sizes;
    text: string;
    hideText?: boolean;
    startIcon?: ComponentType<IconProps>;
    endIcon?: ComponentType<IconProps>;
    onClick?: () => void;
    customStyle?: string;
};

namespace ButtonStyle {
    export const varaint: VariantRecord = {
        none: "",
        primary: "bg-[#dce4fb] text-[#535892] hover:bg-[#c8d0f0] transition-colors",
        secondary: "bg-black text-white hover:bg-gray-900 transition-colors",
    };

    export const padding: SizeRecord = {
        xs: "py-[5px] px-[8px] rounded-md",
        sm: "py-[9px] px-[16px] rounded-lg",
        md: "py-[10px] px-[24px] rounded-lg",
        lg: "py-[14px] px-[32px] rounded-lg",
    };

    export const textSize: SizeRecord = {
        xs: "text-[13px]",
        sm: "text-[14px]",
        md: "text-[15px]",
        lg: "text-[16px]",
    };

    export const size: SizeRecord = {
        xs: "",
        sm: "",
        md: "",
        lg: "w-full",
    };
}

const ButtonDefaultStyles = "flex items-center justify-center font-medium cursor-pointer outline-none transition-all duration-200";

export const Button = memo((props: ButtonProps) => {
    return (
        <button
            onClick={props.onClick}
            className={`${ButtonStyle.varaint[props.varaint]} ${ButtonStyle.padding[props.size]} ${ButtonStyle.textSize[props.size]} ${ButtonStyle.size[props.size]} ${ButtonDefaultStyles} ${props.customStyle || ""}`}
        >
            {props.startIcon ? <div className="pr-2">{<props.startIcon size={props.size} />}</div> : null}
            <div className={`${props.hideText ? "hidden lg:block" : ""}`}>{props.text}</div>
            {props.endIcon ? <div className="pl-2">{<props.endIcon size={props.size} />}</div> : null}
        </button>
    );
});
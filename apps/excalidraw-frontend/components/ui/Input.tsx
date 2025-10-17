import { type Ref, memo } from "react";

type InputType = "TextBox" | "TextArea" | "Password" | "Menu" | "Folder-File";
type Sizes = "fs" | "es" | "sm" | "md" | "lg" | "xl";

type VariantRecord = Record<InputType, string>;
type SizeRecord = Record<Sizes, string>;

type InputProps = {
    inputVaraint: InputType;
    size: Sizes;
    placeholder?: string;
    customPadding?: string;
    customStyle?: string;
    ref?: Ref<HTMLInputElement> | Ref<HTMLTextAreaElement> | Ref<HTMLSelectElement>;
    onInput?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    showText?: boolean;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void  ;
    type?: string;
};

namespace InputStyle {
    export const varaint: VariantRecord = {
        TextBox: "bg-gray-50 text-gray-900 border border-gray-300 focus:border-black focus:ring-0",
        TextArea: "bg-[#4740d6] text-[#ceceff]",
        Password: "bg-gray-50 text-gray-900 border border-gray-300 focus:border-black focus:ring-0",
        Menu: "bg-gray-50 text-gray-900 border border-gray-300",
        "Folder-File": "bg-gray-300 border-2",
    };

    export const size: SizeRecord = {
        fs: "min-w-25 max-w-28 h-6",
        es: "max-w-25",
        sm: "w-full h-10",
        md: "w-full h-11",
        lg: "w-full min-h-11",
        xl: "h-11 w-70 sm:w-65 md:w-78 lg:w-95 xl:w-150",
    };

    export const padding: SizeRecord = {
        fs: "",
        es: "",
        sm: "pl-10 pr-4 py-2.5 rounded-lg",
        md: "px-5 py-3 rounded-lg",
        lg: "px-5 py-3 rounded-xl",
        xl: "px-5 py-3 rounded-xl",
    };

    export const textSize: SizeRecord = {
        fs: "",
        es: "text-[14px]",
        sm: "text-sm",
        md: "text-[15px]",
        lg: "text-[16px]",
        xl: "text-[16px]",
    };
}

const DefaultInputStyle = "outline-none transition-all duration-200";

export const Input = memo((props: InputProps) => {
    return (
        <div>
            {props.inputVaraint === "TextBox" && (
                <input
                    type="text"
                    onInput={props.onInput ? (e: React.KeyboardEvent<HTMLInputElement>) => props.onInput!(e) : () => {}}
                    ref={props.ref as Ref<HTMLInputElement>}
                    spellCheck={false}
                    placeholder={props.placeholder}
                    className={` ${DefaultInputStyle} ${props.customStyle ?? InputStyle.varaint[props.inputVaraint]} ${InputStyle.size[props.size]} ${InputStyle.padding[props.size]} ${InputStyle.textSize[props.size]}`}
                />
            )}

            {props.inputVaraint === "Password" && (
                <input
                    type={props.showText ? "text" : "password"}
                    onInput={props.onInput ? (e: React.KeyboardEvent<HTMLInputElement>) => props.onInput!(e) : () => {}}
                    ref={props.ref as Ref<HTMLInputElement>}
                    spellCheck={false}
                    placeholder={props.placeholder}
                    className={`${DefaultInputStyle} ${InputStyle.varaint[props.inputVaraint]} ${InputStyle.size[props.size]} ${InputStyle.padding[props.size]} ${InputStyle.textSize[props.size]} ${props.customStyle || ""}`}
                    required
                />
            )}

            {props.inputVaraint === "Folder-File" && (
                <input
                    type="text"
                    onInput={props.onInput ? (e: React.KeyboardEvent<HTMLInputElement>) => props.onInput!(e) : () => {}}
                    ref={props.ref as Ref<HTMLInputElement>}
                    spellCheck={false}
                    placeholder={props.placeholder}
                    className={`${DefaultInputStyle} ${props.customStyle || DefaultInputStyle} ${InputStyle.varaint[props.inputVaraint]} ${InputStyle.size[props.size]}`}
                    onKeyDown={(props.onKeyDown) ? props.onKeyDown : () => {}}
                />
            )}

            {props.inputVaraint === "TextArea" && (
                <textarea
                    ref={props.ref as Ref<HTMLTextAreaElement>}
                    spellCheck={false}
                    placeholder={props.placeholder}
                    className={`${DefaultInputStyle} ${InputStyle.size[props.size]} ${InputStyle.padding[props.size]} overflow-y-scroll scrollbar-hide resize-none`}
                />
            )}

            {props.inputVaraint === "Menu" && (
                <select
                    ref={props.ref as Ref<HTMLSelectElement>}
                    className={`${DefaultInputStyle} ${InputStyle.size[props.size]} ${InputStyle.padding[props.size]} ${props.customStyle || ""}`}
                >
                    <option value="Tweet">Tweet</option>
                    <option value="Youtube">Video</option>
                    <option value="Document">Document</option>
                </select>
            )}
        </div>
    );
});

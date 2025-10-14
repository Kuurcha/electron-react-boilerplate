import React from 'react';

interface CustomInputProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  min?: number;
  placeholder?: string;
}

function CustomInput({
  label,
  name,
  value,
  onChange,
  onInput,
  min = 1,
  placeholder,
}: CustomInputProps) {
  return (
    <div className="flex flex-col space-y-1">
      <label htmlFor={name} className="">
        {label}
      </label>
      <span className="icon-[mdi-light--home]"></span>
      <input
        id={name}
        type="number"
        name={name}
        min={min}
        value={value}
        onChange={onChange}
        onInput={(e: React.FormEvent<HTMLInputElement>) => {
          const target = e.target as HTMLInputElement;
          if (Number(target.value) < min) target.value = min.toString();
          if (onInput) onInput(e); // call custom handler if provided
        }}
        placeholder={placeholder}
        className="block py-2.5 px-0 w-full text-m text-white-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
      />
    </div>
  );
}

export default CustomInput;

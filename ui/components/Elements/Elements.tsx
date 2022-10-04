export function Button(props) {
  return (
    <button
      {...props}
      class={`
        font-light
        text-sm
        px-4 
        py-2 
        rounded-full 
        shadow-md
        border
        border-slate-200
        text-slate-200
        hover:border-white
        hover:text-white
        ${props.class}
      `}
    />
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      class={`
        bg-slate-700
        font-light
        px-4 
        py-2 
        rounded 
        shadow-md
        border
        border-slate-400
        text-white
        focus:border-white
        ${props.class}
      `}
    />
  );
}

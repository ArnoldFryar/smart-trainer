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
        border-gray-200
        text-gray-200
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
        bg-gray-700
        font-light
        px-4 
        py-2 
        rounded 
        shadow-md
        border
        border-gray-400
        text-white
        focus:border-white
        ${props.class}
      `}
    />
  );
}

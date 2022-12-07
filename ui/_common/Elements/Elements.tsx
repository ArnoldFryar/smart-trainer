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

export function Radio(props) {
  return (
    <label>
      <input
        {...props}
        type="radio"
        class="hidden peer"
        children={undefined}
      />
      <div class={`
        p-4
        border
        border-gray-400
        text-white
        focus:border-white
        peer-checked:bg-primary-900
        peer-checked:border-primary-400
        ${props.class}
      `}>
        {props.children}
      </div>
    </label>
  );
}
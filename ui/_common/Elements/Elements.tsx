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
    <label class="group">
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
        peer-checked:z-10
        peer-checked:relative
        group-first:rounded-l
        group-last:rounded-r
        text-center
        ${props.class}
      `} style="margin-right:-1px;">
        {props.children}
      </div>
    </label>
  );
}

export function RadioGroup(props) {
  return (
    <fieldset class="my-4">
      <legend class="text-white font-light text-sm mb-1">{props.label}</legend>
      <div class="flex">
        {props.children}
      </div>
    </fieldset>
  );
}
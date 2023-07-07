import { onMount, onCleanup, createEffect } from "solid-js";

export function Button(props) {
  return (
    <button
      {...props}
      class={`
        font-light
        text-sm
        px-3.5 
        py-2 
        rounded-full 
        shadow-md
        border
        text-white
        hover:text-white
        ${props.primary 
          ? "border-primary-500 bg-primary-900 hover:border-primary-400" 
          : "border-gray-600 bg-gray-800 hover:border-gray-500"}
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
        bg-gray-800
        font-light
        px-3.5 
        py-2 
        rounded 
        shadow-md
        border
        border-gray-600
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
        border-gray-600
        bg-gray-800
        text-white
        cursor-pointer
        focus:border-white
        hover:border-gray-500
        peer-checked:z-9
        peer-checked:bg-primary-900
        peer-checked:border-primary-500
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
  let container!: HTMLDivElement;

  createEffect(() => {
    let matched = false;
    const radios: HTMLInputElement[] = Array.from(container.querySelectorAll("input[type=radio]"));
    for (const radio of radios) {
      matched ||= radio.checked = radio.value === String(props.checkedValue);
    }
    if (!matched) {
      radios[0].checked = true;
    }
  });

  return (
    <FieldSet label={props.label} onChange={props.onChange}>
      <div class="flex" ref={container}>
        {props.children}
      </div>
    </FieldSet>
  );
}

export function FieldSet(props) {
  return (
    <fieldset class="my-4" onChange={props.onChange}>
      <legend class="text-white font-light text-sm mb-1">{props.label}</legend>
      {props.children}
    </fieldset>
  );
}

export function Select(props) {
  return (
    <select
      {...props}
      class={`
        rounded
        p-2
        bg-gray-800
        shadow-md
        border
        border-gray-600
        text-gray-200
        ${props.class}
      `}
    />
  );
}

export function Slider(props) {
  let slider_input!: HTMLInputElement;
  let slider_thumb!: HTMLDivElement;
  let slider_line!: HTMLDivElement;

  function showSliderValue() {
    const percent = (+slider_input.value - +slider_input.min) / (+slider_input.max - +slider_input.min);
    const space = slider_input.offsetWidth - slider_thumb.offsetWidth;

    slider_thumb.setAttribute("style", `left: ${percent * space}px`);
    slider_line.setAttribute("style", `width: ${percent * space}px`);
    slider_thumb.innerHTML = slider_input.value;
  }

  onMount(() => {
    showSliderValue();
    window.addEventListener("resize", showSliderValue);
    slider_input.addEventListener('input', showSliderValue, false);
  });

  onCleanup(() => {
    window.removeEventListener("resize", showSliderValue);
    slider_input.removeEventListener('input', showSliderValue, false);
  });

  return (
    <div class={`relative w-full h-8 my-2`}>
      <input
        ref={slider_input}
        type="range"
        name={props.name}
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
        onInput={props.onInput}
        class={`
          peer
          w-full
          absolute
          z-[3]
          -translate-y-2/4
          appearance-none
          w-full
          h-1
          opacity-0
          m-0
          top-2/4
          cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-12
          [&::-webkit-slider-thumb]:h-12
          [&::-webkit-slider-thumb]:cursor-ew-resize
          [&::-webkit-slider-thumb]:opacity-0
          [&::-webkit-slider-thumb]:rounded-full
        `} />
      <div 
        ref={slider_thumb}
        class={`
          w-8
          h-8
          absolute
          -translate-y-2/4
          bg-primary-900
          flex
          justify-center
          items-center
          text-sm
          text-white
          z-[2]
          rounded-full
          border
          border-primary-500
          left-0
          top-2/4
          peer-hover:border-primary-400
        `} />
      <div class={`h-0.5 rounded w-full bg-gray-600 -translate-y-2/4 absolute z-[1] left-0 top-2/4 peer-hover:bg-gray-500`}>
      </div>
      <div ref={slider_line} class={`absolute h-0.5 rounded-l w-0 -translate-y-2/4 z-[2] left-0 top-2/4 bg-primary-500 peer-hover:bg-primary-400`} />
      <div>{props.labelLow}</div>
      <div>{props.labelHigh}</div>
    </div>
  );
}
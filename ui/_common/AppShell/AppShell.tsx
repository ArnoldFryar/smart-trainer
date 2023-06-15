import { createSignal, For } from "solid-js"

export function AppShell(props: { tabs: { label: string, view: any }[] }) {
  const [selectedTab, setSelectedTab] = createSignal(0);
  return (
    <div class="flex flex-col h-screen">
      <div class="flex-1 overflow-y-auto">
        {props.tabs[selectedTab()].view}
      </div>
      <div class="flex bg-gray-800 justify-center">
        <For each={props.tabs}>
          {(tab, index) => (
            <NavItem selected={index() === selectedTab()} onClick={() => setSelectedTab(index())}>
              {tab.label}
            </NavItem>
          )}
        </For>
      </div>
    </div>
  )
}

function NavItem(props) {
  return (
    <div onClick={props.onClick} class={`p-4 font-medium ${props.selected ? "text-primary-500" : "text-gray-500 hover:text-gray-400 cursor-pointer"}`}>
      {props.children}
    </div>
  )
}
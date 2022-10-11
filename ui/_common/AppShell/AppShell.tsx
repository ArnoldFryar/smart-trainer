export function AppShell(props) {
  return (
    <div class="flex flex-col h-screen">
      <div class="flex-1">
        {props.children}
      </div>
      <div class="flex bg-gray-800 justify-center">
        <NavItem selected>
          Activity
        </NavItem>
        <NavItem>
          Performance
        </NavItem>
        <NavItem>
          Learn
        </NavItem>
        <NavItem>
          Settings
        </NavItem>
      </div>
    </div>
  )
}

function NavItem(props) {
  return (
    <div class={`p-4 font-medium ${props.selected ? "text-primary-500" : "text-gray-500 hover:text-gray-400"}`}>
      {props.children}
    </div>
  )
}
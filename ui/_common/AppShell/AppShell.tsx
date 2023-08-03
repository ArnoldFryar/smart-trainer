import { A, Outlet } from "@solidjs/router";

export function AppShell(props) {
  return (
    <div class="flex flex-col h-screen">
      <div class="flex-1 overflow-y-auto">
        <Outlet/>
      </div>
      <div class="flex bg-gray-800 justify-stretch">
        <NavItem href="/activity">
          Activity
        </NavItem>
        <NavItem href="/performance">
          Performance
        </NavItem>
        <NavItem href="/manual">
          Manual
        </NavItem>
        <NavItem href="/learn">
          Learn
        </NavItem>
        <NavItem href="/settings">
          Settings
        </NavItem>
      </div>
    </div>
  )
}
function NavItem(props) {
  return (
    <A href={props.href} class="text-sm flex-1 py-4 font-medium text-center" activeClass="text-primary-500" inactiveClass="text-gray-500 hover:text-gray-400 cursor-pointer">
      {props.children}
    </A>
  )
}
import { createContext } from "react"

export interface IMenuContext{
  onChangeMenu: (label: string, tags?: string[]) => void
}

export const MenuContext = createContext<IMenuContext>({
  onChangeMenu: () => {}
})
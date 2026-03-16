import { ReactNode } from "react";

interface ISideBarItemProps {
  // id: string;
  children: ReactNode;
}

interface IProps {
  children: ReactNode;
}

export function SideBar(props: IProps) {
  return (
    <div>
      <div>{props.children}</div>
    </div>
  );
}

export function SideBarItem(props: ISideBarItemProps) {
  return (
    <div>
      {props.children}
    </div>
  );
}

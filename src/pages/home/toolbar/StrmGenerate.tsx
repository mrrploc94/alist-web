import { MenuItem } from "@hope-ui/solid"
import { useT } from "~/hooks"
import { Show } from "solid-js"
import { TbFileExport } from "solid-icons/tb"
import { useRouter } from "~/hooks"
import { me, objStore } from "~/store"
import { StrmGenerate } from "~/pages/manage/storages/StrmGenerate"
import { RightIcon } from "./Icon"

export const ToolbarStrmGenerate = (props: { menu?: boolean }) => {
  const t = useT()
  const { pathname } = useRouter()
  const isAdmin = () => (me().role || []).includes(2)
  const isStrm = () => objStore.provider === "Strm"
  return (
    <Show when={isAdmin() && isStrm()}>
      <StrmGenerate path={pathname()}>
        {({ start }) => (
          <Show
            when={props.menu}
            fallback={
              <RightIcon
                as={TbFileExport}
                tips="generate_strm"
                onClick={start}
              />
            }
          >
            <MenuItem icon={<TbFileExport />} onSelect={start}>
              {t("home.toolbar.generate_strm")}
            </MenuItem>
          </Show>
        )}
      </StrmGenerate>
    </Show>
  )
}

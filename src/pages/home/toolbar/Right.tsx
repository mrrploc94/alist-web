import { Menu, MenuContent, MenuItem, MenuTrigger } from "@hope-ui/solid"
import { Show } from "solid-js"
import {
  FiMoreHorizontal,
  FiSettings,
  FiCheckSquare,
  FiRefreshCw,
  FiDownloadCloud,
  FiBookOpen,
} from "solid-icons/fi"
import { objStore, selectAll, State, toggleCheckbox, userCan } from "~/store"
import { bus } from "~/utils"
import { operations } from "./operations"
import { usePath, useT } from "~/hooks"
import { isTocVisible, setTocDisabled } from "~/components"
import { ToolbarStrmGenerate } from "./StrmGenerate"

export const Right = () => {
  const t = useT()
  const { refresh } = usePath()
  const isFolder = () => objStore.state === State.Folder
  const action = (name: string) => bus.emit("tool", name)
  return (
    <Menu placement="bottom-end">
      <MenuTrigger
        as="button"
        type="button"
        class="atp-button atp-more-actions"
        aria-label={t("workspace.more_actions")}
      >
        <FiMoreHorizontal aria-hidden="true" />
        <span>{t("workspace.more_actions")}</span>
      </MenuTrigger>
      <MenuContent class="atp-file-menu">
        <MenuItem
          icon={<FiRefreshCw />}
          onSelect={() => refresh(undefined, true)}
        >
          {t("global.refresh")}
        </MenuItem>
        <Show when={isFolder() && (userCan("write") || objStore.write)}>
          <MenuItem
            icon={operations.new_file.icon({})}
            onSelect={() => action("new_file")}
          >
            {t("home.toolbar.new_file")}
          </MenuItem>
          <MenuItem
            icon={operations.mkdir.icon({})}
            onSelect={() => action("mkdir")}
          >
            {t("home.toolbar.mkdir")}
          </MenuItem>
          <MenuItem
            icon={operations.recursive_move.icon({})}
            onSelect={() => action("recursiveMove")}
          >
            {t("home.toolbar.recursive_move")}
          </MenuItem>
          <MenuItem
            icon={operations.remove_empty_directory.icon({})}
            onSelect={() => action("removeEmptyDirectory")}
          >
            {t("home.toolbar.remove_empty_directory")}
          </MenuItem>
          <MenuItem
            icon={operations.batch_rename.icon({})}
            onSelect={() => {
              selectAll(true)
              action("batchRename")
            }}
          >
            {t("home.toolbar.batch_rename")}
          </MenuItem>
          <MenuItem
            icon={<FiDownloadCloud />}
            onSelect={() => action("upload")}
          >
            {t("home.toolbar.upload")}
          </MenuItem>
        </Show>
        <Show when={isFolder() && userCan("offline_download")}>
          <MenuItem
            icon={<FiDownloadCloud />}
            onSelect={() => action("offline_download")}
          >
            {t("home.toolbar.offline_download")}
          </MenuItem>
        </Show>
        <ToolbarStrmGenerate menu />
        <Show when={isTocVisible()}>
          <MenuItem
            icon={<FiBookOpen />}
            onSelect={() => setTocDisabled((disabled) => !disabled)}
          >
            {t("home.toolbar.toggle_markdown_toc")}
          </MenuItem>
        </Show>
        <MenuItem icon={<FiCheckSquare />} onSelect={toggleCheckbox}>
          {t("home.toolbar.toggle_checkbox")}
        </MenuItem>
        <MenuItem
          icon={<FiSettings />}
          onSelect={() => action("local_settings")}
        >
          {t("home.toolbar.local_settings")}
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}

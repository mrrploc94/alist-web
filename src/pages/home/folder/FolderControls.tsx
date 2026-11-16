import { For, Show } from "solid-js"
import { FiList, FiGrid, FiImage, FiSearch, FiRefreshCw } from "solid-icons/fi"
import { getSetting, layout, setLayout, LayoutType, objStore } from "~/store"
import { usePath, useT } from "~/hooks"
import { bus } from "~/utils"
export const FolderControls = () => {
  const t = useT(),
    { refresh } = usePath()
  const modes = [
    ["list", FiList],
    ["grid", FiGrid],
    ["image", FiImage],
  ] as const
  return (
    <div class="atp-folder-controls">
      <Show
        when={!["none", "no_index", ""].includes(getSetting("search_index"))}
      >
        <button
          class="atp-file-search"
          onClick={() => bus.emit("tool", "search")}
        >
          <FiSearch />
          <span>{t("workspace.search_files")}</span>
          <kbd>Ctrl K</kbd>
        </button>
      </Show>
      <span class="atp-file-count">
        {t("workspace.item_count", { count: String(objStore.objs.length) })}
      </span>
      <div
        class="atp-layout-switch"
        role="group"
        aria-label={t("workspace.view_mode")}
      >
        <For each={modes}>
          {([mode, Icon]) => (
            <button
              classList={{ active: layout() === mode }}
              aria-label={t(`home.layouts.${mode}`)}
              aria-pressed={layout() === mode}
              onClick={() => setLayout(mode as LayoutType)}
            >
              <Icon />
            </button>
          )}
        </For>
      </div>
      <button
        class="atp-icon-button"
        aria-label={t("global.refresh")}
        onClick={() => refresh(undefined, true)}
      >
        <FiRefreshCw />
      </button>
    </div>
  )
}

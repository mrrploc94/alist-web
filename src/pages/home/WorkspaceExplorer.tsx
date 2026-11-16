import { createEffect, createSignal, Show } from "solid-js"
import {
  createDisclosure,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from "@hope-ui/solid"
import { FiFolderPlus, FiUpload, FiFolder } from "solid-icons/fi"
import { FolderTree, FolderTreeHandler } from "~/components"
import { WorkspaceHeader } from "~/components/workspace/WorkspaceHeader"
import { useRouter, useT } from "~/hooks"
import { objStore, State, userCan } from "~/store"
import { bus } from "~/utils"
import { Right } from "./toolbar/Right"

export const ExplorerTree = () => {
  const { pathname, to } = useRouter()
  const [handler, setHandler] = createSignal<FolderTreeHandler>()
  createEffect(() => handler()?.setPath(pathname()))
  return (
    <FolderTree
      autoOpen
      showEmptyIcon
      showHiddenFolder={false}
      handle={setHandler}
      onChange={(path) => to(path)}
    />
  )
}
export const ExplorerHeader = () => {
  const t = useT(),
    { isOpen, onOpen, onClose } = createDisclosure()
  return (
    <>
      <WorkspaceHeader onMenu={onOpen} />
      <Drawer opened={isOpen()} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent class="atp-nav-drawer">
          <DrawerCloseButton />
          <DrawerHeader>{t("workspace.folders")}</DrawerHeader>
          <DrawerBody>
            <ExplorerTree />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
export const ExplorerHeading = () => {
  const t = useT(),
    { pathname } = useRouter()
  const folderName = () => {
    const name = pathname().split("/").filter(Boolean).pop()
    if (!name) return t("workspace.all_files")
    try {
      return decodeURIComponent(name)
    } catch {
      return name
    }
  }
  const canWrite = () =>
    objStore.state === State.Folder && (userCan("write") || objStore.write)
  return (
    <header class="atp-file-heading">
      <div>
        <h1>{folderName()}</h1>
        <p>{t("workspace.file_description")}</p>
      </div>
      <div class="atp-file-actions">
        <Show when={canWrite()}>
          <button class="atp-button" onClick={() => bus.emit("tool", "mkdir")}>
            <FiFolderPlus />
            {t("home.toolbar.mkdir")}
          </button>
          <button
            class="atp-button atp-primary"
            onClick={() => bus.emit("tool", "upload")}
          >
            <FiUpload />
            {t("home.toolbar.upload")}
          </button>
        </Show>
        <Right />
      </div>
    </header>
  )
}

import {
  createDisclosure,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from "@hope-ui/solid"
import { WorkspaceHeader } from "~/components/workspace/WorkspaceHeader"
import { ManageNavigation } from "~/components/workspace/ManageNavigation"
import { useT } from "~/hooks"
const { isOpen, onOpen, onClose } = createDisclosure()
const Header = () => {
  const t = useT()
  return (
    <>
      <WorkspaceHeader manage onMenu={onOpen} />
      <Drawer opened={isOpen()} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent class="atp-nav-drawer">
          <DrawerCloseButton />
          <DrawerHeader>{t("workspace.management")}</DrawerHeader>
          <DrawerBody>
            <ManageNavigation onNavigate={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
export { Header, onClose }
